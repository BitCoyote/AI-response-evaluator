from sqlalchemy import desc
from sqlalchemy.orm import Session, joinedload

from app.db.database import Evaluation, ModelResponse


class EvaluationRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, evaluation_id: int, user_id: int) -> Evaluation | None:
        return (
            self.db.query(Evaluation)
            .options(joinedload(Evaluation.responses))
            .filter(Evaluation.id == evaluation_id, Evaluation.user_id == user_id)
            .first()
        )

    def list_all(
        self,
        user_id: int,
        search: str | None = None,
        category: str | None = None,
        sort_by: str = "created_at",
        sort_order: str = "desc",
        skip: int = 0,
        limit: int = 50,
    ) -> list[Evaluation]:
        query = self.db.query(Evaluation).filter(Evaluation.user_id == user_id)

        if search:
            pattern = f"%{search}%"
            query = query.filter(
                (Evaluation.title.ilike(pattern)) | (Evaluation.prompt.ilike(pattern))
            )
        if category:
            query = query.filter(Evaluation.category == category)

        sort_column = getattr(Evaluation, sort_by, Evaluation.created_at)
        query = query.order_by(desc(sort_column) if sort_order == "desc" else sort_column)
        return query.offset(skip).limit(limit).all()

    def count(self, user_id: int) -> int:
        return self.db.query(Evaluation).filter(Evaluation.user_id == user_id).count()

    def create(self, evaluation: Evaluation) -> Evaluation:
        self.db.add(evaluation)
        self.db.commit()
        self.db.refresh(evaluation)
        return evaluation

    def add_response(self, response: ModelResponse) -> ModelResponse:
        self.db.add(response)
        self.db.commit()
        self.db.refresh(response)
        return response

    def update(self, evaluation: Evaluation) -> Evaluation:
        self.db.commit()
        self.db.refresh(evaluation)
        return evaluation

    def delete(self, evaluation: Evaluation) -> None:
        self.db.delete(evaluation)
        self.db.commit()

    def get_recent(self, user_id: int, limit: int = 5) -> list[Evaluation]:
        return (
            self.db.query(Evaluation)
            .filter(Evaluation.user_id == user_id)
            .order_by(desc(Evaluation.created_at))
            .limit(limit)
            .all()
        )

    def get_all_with_responses(self, user_id: int) -> list[Evaluation]:
        return (
            self.db.query(Evaluation)
            .options(joinedload(Evaluation.responses))
            .filter(Evaluation.user_id == user_id)
            .all()
        )
