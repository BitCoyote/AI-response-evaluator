from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.core.config import get_settings
from app.core.rate_limit import limiter
from app.db.database import User, get_db
from app.schemas.schemas import (
    PromptLibraryCreate,
    PromptLibraryResponse,
    PromptLibraryUpdate,
    PromptOptimizeRequest,
    PromptOptimizeResponse,
)
from app.services.evaluation_service import PromptLibraryService

router = APIRouter(prefix="/prompts", tags=["Prompt Library"])


@router.post("", response_model=PromptLibraryResponse, status_code=201)
@limiter.limit(get_settings().rate_limit)
def create_prompt(
    request: Request,
    data: PromptLibraryCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return PromptLibraryService(db).create(current_user.id, data)


@router.get("", response_model=list[PromptLibraryResponse])
@limiter.limit(get_settings().rate_limit)
def list_prompts(
    request: Request,
    category: str | None = None,
    search: str | None = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return PromptLibraryService(db).list_all(current_user.id, category=category, search=search)


@router.get("/{prompt_id}", response_model=PromptLibraryResponse)
@limiter.limit(get_settings().rate_limit)
def get_prompt(
    request: Request,
    prompt_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return PromptLibraryService(db).get(prompt_id, current_user.id)


@router.patch("/{prompt_id}", response_model=PromptLibraryResponse)
@limiter.limit(get_settings().rate_limit)
def update_prompt(
    request: Request,
    prompt_id: int,
    data: PromptLibraryUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return PromptLibraryService(db).update(prompt_id, current_user.id, data)


@router.delete("/{prompt_id}", status_code=204)
@limiter.limit(get_settings().rate_limit)
def delete_prompt(
    request: Request,
    prompt_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    PromptLibraryService(db).delete(prompt_id, current_user.id)


@router.post("/optimize", response_model=PromptOptimizeResponse)
@limiter.limit("10/minute")
async def optimize_prompt(
    request: Request,
    data: PromptOptimizeRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    result = await PromptLibraryService(db).optimize(data)
    return PromptOptimizeResponse(**result)
