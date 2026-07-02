from fastapi import APIRouter, Depends, HTTPException, Query, Request
from fastapi.responses import Response
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.core.config import get_settings
from app.core.rate_limit import limiter
from app.db.database import User, get_db
from app.schemas.schemas import (
    AnalyticsResponse,
    DashboardStats,
    EvaluationCreate,
    EvaluationListItem,
    EvaluationResponse,
)
from app.services.evaluation_service import EvaluationService, ExportServiceWrapper

router = APIRouter(prefix="/evaluations", tags=["Evaluations"])


@router.post("", response_model=EvaluationResponse, status_code=201)
@limiter.limit("10/minute")
async def create_evaluation(
    request: Request,
    data: EvaluationCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    evaluation = await EvaluationService(db).run_evaluation(current_user.id, data)
    return EvaluationService(db).get_evaluation(evaluation.id, current_user.id)


@router.get("", response_model=list[EvaluationListItem])
@limiter.limit(get_settings().rate_limit)
def list_evaluations(
    request: Request,
    search: str | None = None,
    category: str | None = None,
    sort_by: str = Query("created_at"),
    sort_order: str = Query("desc"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return EvaluationService(db).list_evaluations(
        current_user.id,
        search=search,
        category=category,
        sort_by=sort_by,
        sort_order=sort_order,
        skip=skip,
        limit=limit,
    )


@router.get("/dashboard", response_model=DashboardStats)
@limiter.limit(get_settings().rate_limit)
def get_dashboard(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return EvaluationService(db).get_dashboard_stats(current_user.id)


@router.get("/analytics", response_model=AnalyticsResponse)
@limiter.limit(get_settings().rate_limit)
def get_analytics(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return EvaluationService(db).get_analytics(current_user.id)


@router.get("/{evaluation_id}", response_model=EvaluationResponse)
@limiter.limit(get_settings().rate_limit)
def get_evaluation(
    request: Request,
    evaluation_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return EvaluationService(db).get_evaluation(evaluation_id, current_user.id)


@router.delete("/{evaluation_id}", status_code=204)
@limiter.limit(get_settings().rate_limit)
def delete_evaluation(
    request: Request,
    evaluation_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    EvaluationService(db).delete_evaluation(evaluation_id, current_user.id)


@router.get("/{evaluation_id}/export/{fmt}")
@limiter.limit("20/minute")
def export_evaluation(
    request: Request,
    evaluation_id: int,
    fmt: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        content, media_type, filename = ExportServiceWrapper(db).export_evaluation(
            evaluation_id, current_user.id, fmt
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return Response(
        content=content,
        media_type=media_type,
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
