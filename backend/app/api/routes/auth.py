from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.core.rate_limit import limiter
from app.core.config import get_settings
from app.db.database import User, get_db
from app.schemas.schemas import Token, UserCreate, UserLogin, UserResponse, UserSettingsUpdate
from app.services.evaluation_service import AuthService
from app.repositories.user_repository import UserRepository

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=UserResponse, status_code=201)
@limiter.limit(get_settings().rate_limit)
def register(request: Request, data: UserCreate, db: Session = Depends(get_db)):
    return AuthService(db).register(data)


@router.post("/login", response_model=Token)
@limiter.limit(get_settings().rate_limit)
def login(request: Request, data: UserLogin, db: Session = Depends(get_db)):
    token = AuthService(db).login(data)
    return Token(access_token=token)


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.patch("/me", response_model=UserResponse)
def update_me(
    data: UserSettingsUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return UserRepository(db).update_settings(
        current_user,
        **data.model_dump(exclude_unset=True),
    )
