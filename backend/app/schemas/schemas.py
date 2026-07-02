from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserBase(BaseModel):
    email: EmailStr
    username: str = Field(min_length=3, max_length=100)
    full_name: str | None = None


class UserCreate(UserBase):
    password: str = Field(min_length=6, max_length=128)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(UserBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    dark_mode: bool
    created_at: datetime


class UserSettingsUpdate(BaseModel):
    full_name: str | None = None
    dark_mode: bool | None = None


class ScoreMetrics(BaseModel):
    accuracy: float = Field(ge=0, le=100)
    completeness: float = Field(ge=0, le=100)
    reasoning: float = Field(ge=0, le=100)
    instruction_following: float = Field(ge=0, le=100)
    safety: float = Field(ge=0, le=100)
    conciseness: float = Field(ge=0, le=100)
    readability: float = Field(ge=0, le=100)
    hallucination_risk: float = Field(ge=0, le=100)
    overall: float = Field(ge=0, le=100)


class HallucinationItem(BaseModel):
    text: str
    type: str
    confidence: str
    explanation: str


class HallucinationAnalysis(BaseModel):
    unsupported_facts: list[HallucinationItem] = []
    conflicting_info: list[HallucinationItem] = []
    low_confidence: list[HallucinationItem] = []
    possible_hallucinations: list[HallucinationItem] = []


class ModelResponseSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    model_name: str
    provider: str
    content: str
    latency_ms: int
    scores: dict[str, float]
    hallucination_analysis: dict[str, Any]


class EvaluationAnalysis(BaseModel):
    summary: str
    strengths: list[str]
    weaknesses: list[str]
    best_response: str
    recommended_improvements: list[str]
    prompt_optimization_suggestions: list[str]


class EvaluationCreate(BaseModel):
    prompt: str = Field(min_length=1, max_length=10000)
    system_prompt: str | None = Field(default=None, max_length=5000)
    category: str = "Custom"
    temperature: float = Field(default=0.7, ge=0, le=2)
    max_tokens: int = Field(default=1024, ge=64, le=4096)
    models: list[str] = Field(min_length=1)
    title: str | None = None


class EvaluationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    prompt: str
    system_prompt: str | None
    category: str
    temperature: float
    max_tokens: int
    models_used: list[str]
    status: str
    analysis: dict[str, Any] | None
    created_at: datetime
    responses: list[ModelResponseSchema] = []


class EvaluationListItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    prompt: str
    category: str
    models_used: list[str]
    status: str
    created_at: datetime


class PromptLibraryCreate(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    prompt: str = Field(min_length=1, max_length=10000)
    system_prompt: str | None = None
    category: str = "Custom"
    tags: list[str] = []


class PromptLibraryUpdate(BaseModel):
    title: str | None = None
    prompt: str | None = None
    system_prompt: str | None = None
    category: str | None = None
    tags: list[str] | None = None


class PromptLibraryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    prompt: str
    system_prompt: str | None
    category: str
    tags: list[str]
    created_at: datetime
    updated_at: datetime


class PromptOptimizeRequest(BaseModel):
    prompt: str = Field(min_length=1, max_length=10000)
    system_prompt: str | None = None
    category: str = "Custom"


class PromptOptimizeResponse(BaseModel):
    better_prompt: str
    few_shot_prompt: str
    chain_of_thought_prompt: str
    structured_prompt: str


class AnalyticsResponse(BaseModel):
    total_evaluations: int
    average_model_scores: dict[str, float]
    most_accurate_model: str
    average_hallucination_rate: float
    prompt_categories: dict[str, int]
    most_used_models: dict[str, int]
    evaluations_over_time: list[dict[str, Any]]
    score_trends: dict[str, list[float]]


class DashboardStats(BaseModel):
    total_evaluations: int
    total_prompts: int
    avg_overall_score: float
    recent_evaluations: list[EvaluationListItem]
