import asyncio
import logging

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import create_access_token, verify_password
from app.db.database import Evaluation, ModelResponse, PromptLibraryItem
from app.repositories.evaluation_repository import EvaluationRepository
from app.repositories.prompt_repository import PromptLibraryRepository
from app.repositories.user_repository import UserRepository
from app.schemas.schemas import (
    AnalyticsResponse,
    DashboardStats,
    EvaluationCreate,
    EvaluationListItem,
    PromptLibraryCreate,
    PromptLibraryUpdate,
    PromptOptimizeRequest,
    UserCreate,
    UserLogin,
)
from app.services.ai_service import AIService
from app.services.export_service import ExportService

logger = logging.getLogger(__name__)


class AuthService:
    def __init__(self, db: Session):
        self.repo = UserRepository(db)

    def register(self, data: UserCreate):
        if self.repo.get_by_email(data.email):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")
        if self.repo.get_by_username(data.username):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Username already taken")
        return self.repo.create(data)

    def login(self, data: UserLogin) -> str:
        user = self.repo.get_by_email(data.email)
        if not user or not verify_password(data.password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password",
            )
        return create_access_token(str(user.id))


class EvaluationService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = EvaluationRepository(db)
        self.ai = AIService()

    async def run_evaluation(self, user_id: int, data: EvaluationCreate) -> Evaluation:
        title = data.title or data.prompt[:80] + ("..." if len(data.prompt) > 80 else "")

        evaluation = Evaluation(
            user_id=user_id,
            title=title,
            prompt=data.prompt,
            system_prompt=data.system_prompt,
            category=data.category,
            temperature=data.temperature,
            max_tokens=data.max_tokens,
            models_used=data.models,
            status="processing",
        )
        evaluation = self.repo.create(evaluation)

        try:
            tasks = [
                self.ai.generate_response(
                    model, data.prompt, data.system_prompt, data.temperature, data.max_tokens
                )
                for model in data.models
            ]
            responses = await asyncio.gather(*tasks)

            eval_result = await self.ai.evaluate_responses(
                data.prompt, responses, data.system_prompt
            )

            eval_map = {r["model_name"]: r for r in eval_result.get("responses", [])}

            for resp in responses:
                model_eval = eval_map.get(resp["model_name"], {})
                model_response = ModelResponse(
                    evaluation_id=evaluation.id,
                    model_name=resp["model_name"],
                    provider=resp["provider"],
                    content=resp["content"],
                    latency_ms=resp["latency_ms"],
                    scores=model_eval.get("scores", {}),
                    hallucination_analysis=model_eval.get("hallucination_analysis", {}),
                )
                self.repo.add_response(model_response)

            evaluation.analysis = eval_result.get("analysis", {})
            evaluation.status = "completed"
            return self.repo.update(evaluation)

        except Exception as exc:
            logger.exception("Evaluation failed: %s", exc)
            evaluation.status = "failed"
            self.repo.update(evaluation)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Evaluation failed: {str(exc)}",
            ) from exc

    def get_evaluation(self, evaluation_id: int, user_id: int) -> Evaluation:
        evaluation = self.repo.get_by_id(evaluation_id, user_id)
        if not evaluation:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Evaluation not found")
        return evaluation

    def list_evaluations(self, user_id: int, **filters) -> list[Evaluation]:
        return self.repo.list_all(user_id, **filters)

    def delete_evaluation(self, evaluation_id: int, user_id: int) -> None:
        evaluation = self.get_evaluation(evaluation_id, user_id)
        self.repo.delete(evaluation)

    def get_dashboard_stats(self, user_id: int) -> DashboardStats:
        prompt_repo = PromptLibraryRepository(self.db)
        evaluations = self.repo.get_all_with_responses(user_id)
        recent = self.repo.get_recent(user_id, 5)

        overall_scores = []
        for ev in evaluations:
            for resp in ev.responses:
                if resp.scores and "overall" in resp.scores:
                    overall_scores.append(resp.scores["overall"])

        avg_score = round(sum(overall_scores) / len(overall_scores), 1) if overall_scores else 0.0

        return DashboardStats(
            total_evaluations=self.repo.count(user_id),
            total_prompts=prompt_repo.count(user_id),
            avg_overall_score=avg_score,
            recent_evaluations=[EvaluationListItem.model_validate(e) for e in recent],
        )

    def get_analytics(self, user_id: int) -> AnalyticsResponse:
        evaluations = self.repo.get_all_with_responses(user_id)

        model_scores: dict[str, list[float]] = {}
        model_counts: dict[str, int] = {}
        hallucination_rates: list[float] = []
        categories: dict[str, int] = {}

        for ev in evaluations:
            categories[ev.category] = categories.get(ev.category, 0) + 1
            for resp in ev.responses:
                model = resp.model_name
                model_counts[model] = model_counts.get(model, 0) + 1
                if resp.scores:
                    model_scores.setdefault(model, []).append(resp.scores.get("overall", 0))
                    hallucination_rates.append(resp.scores.get("hallucination_risk", 0))

        avg_model_scores = {
            model: round(sum(scores) / len(scores), 1) for model, scores in model_scores.items()
        }
        most_accurate = (
            max(avg_model_scores, key=avg_model_scores.get) if avg_model_scores else "N/A"
        )

        from collections import defaultdict

        time_buckets: dict[str, int] = defaultdict(int)
        for ev in evaluations:
            key = ev.created_at.strftime("%Y-%m-%d")
            time_buckets[key] += 1

        evaluations_over_time = [
            {"date": k, "count": v} for k, v in sorted(time_buckets.items())
        ]

        return AnalyticsResponse(
            total_evaluations=len(evaluations),
            average_model_scores=avg_model_scores,
            most_accurate_model=most_accurate,
            average_hallucination_rate=round(
                sum(hallucination_rates) / len(hallucination_rates), 1
            )
            if hallucination_rates
            else 0.0,
            prompt_categories=categories,
            most_used_models=model_counts,
            evaluations_over_time=evaluations_over_time,
            score_trends=model_scores,
        )


class PromptLibraryService:
    def __init__(self, db: Session):
        self.repo = PromptLibraryRepository(db)
        self.ai = AIService()

    def create(self, user_id: int, data: PromptLibraryCreate) -> PromptLibraryItem:
        item = PromptLibraryItem(user_id=user_id, **data.model_dump())
        return self.repo.create(item)

    def list_all(self, user_id: int, **filters) -> list[PromptLibraryItem]:
        return self.repo.list_all(user_id, **filters)

    def get(self, item_id: int, user_id: int) -> PromptLibraryItem:
        item = self.repo.get_by_id(item_id, user_id)
        if not item:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Prompt not found")
        return item

    def update(self, item_id: int, user_id: int, data: PromptLibraryUpdate) -> PromptLibraryItem:
        item = self.get(item_id, user_id)
        for key, value in data.model_dump(exclude_unset=True).items():
            setattr(item, key, value)
        return self.repo.update(item)

    def delete(self, item_id: int, user_id: int) -> None:
        item = self.get(item_id, user_id)
        self.repo.delete(item)

    async def optimize(self, data: PromptOptimizeRequest) -> dict[str, str]:
        return await self.ai.optimize_prompt(data.prompt, data.system_prompt, data.category)


class ExportServiceWrapper:
    def __init__(self, db: Session):
        self.eval_service = EvaluationService(db)
        self.export = ExportService()

    def export_evaluation(self, evaluation_id: int, user_id: int, fmt: str):
        evaluation = self.eval_service.get_evaluation(evaluation_id, user_id)
        return self.export.export(evaluation, fmt)
