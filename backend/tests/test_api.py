import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.db.database import Base, get_db
from app.main import app

SQLALCHEMY_DATABASE_URL = "sqlite://"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def client():
    def override_get_db():
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


@pytest.fixture
def auth_headers(client):
    client.post(
        "/api/auth/register",
        json={
            "email": "test@example.com",
            "username": "testuser",
            "password": "testpass123",
            "full_name": "Test User",
        },
    )
    response = client.post(
        "/api/auth/login",
        json={"email": "test@example.com", "password": "testpass123"},
    )
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_health(client):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"


def test_register_and_login(client):
    response = client.post(
        "/api/auth/register",
        json={
            "email": "user@test.com",
            "username": "user1",
            "password": "password123",
        },
    )
    assert response.status_code == 201
    assert response.json()["email"] == "user@test.com"

    response = client.post(
        "/api/auth/login",
        json={"email": "user@test.com", "password": "password123"},
    )
    assert response.status_code == 200
    assert "access_token" in response.json()


def test_get_me(client, auth_headers):
    response = client.get("/api/auth/me", headers=auth_headers)
    assert response.status_code == 200
    assert response.json()["username"] == "testuser"


def test_create_prompt(client, auth_headers):
    response = client.post(
        "/api/prompts",
        headers=auth_headers,
        json={
            "title": "Test Prompt",
            "prompt": "What is AI?",
            "category": "Research",
        },
    )
    assert response.status_code == 201
    assert response.json()["title"] == "Test Prompt"


def test_list_prompts(client, auth_headers):
    client.post(
        "/api/prompts",
        headers=auth_headers,
        json={"title": "P1", "prompt": "Test", "category": "Coding"},
    )
    response = client.get("/api/prompts", headers=auth_headers)
    assert response.status_code == 200
    assert len(response.json()) >= 1


def test_dashboard_stats(client, auth_headers):
    response = client.get("/api/evaluations/dashboard", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert "total_evaluations" in data
    assert "total_prompts" in data


def test_analytics(client, auth_headers):
    response = client.get("/api/evaluations/analytics", headers=auth_headers)
    assert response.status_code == 200
    assert "average_model_scores" in response.json()


def test_unauthorized_access(client):
    response = client.get("/api/auth/me")
    assert response.status_code in (401, 403)


def test_create_evaluation(client, auth_headers):
    response = client.post(
        "/api/evaluations",
        headers=auth_headers,
        json={
            "prompt": "What is Python?",
            "category": "Coding",
            "temperature": 0.7,
            "max_tokens": 256,
            "models": ["gpt-4"],
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert data["status"] == "completed"
    assert len(data["responses"]) == 1
    assert data["responses"][0]["scores"]["overall"] > 0


def test_update_prompt(client, auth_headers):
    create = client.post(
        "/api/prompts",
        headers=auth_headers,
        json={"title": "Original", "prompt": "Test prompt", "category": "Coding"},
    )
    prompt_id = create.json()["id"]

    response = client.patch(
        f"/api/prompts/{prompt_id}",
        headers=auth_headers,
        json={"title": "Updated Title"},
    )
    assert response.status_code == 200
    assert response.json()["title"] == "Updated Title"


def test_export_evaluation_json(client, auth_headers):
    evaluation = client.post(
        "/api/evaluations",
        headers=auth_headers,
        json={
            "prompt": "Explain REST APIs",
            "category": "Research",
            "models": ["gpt-4"],
        },
    ).json()

    response = client.get(
        f"/api/evaluations/{evaluation['id']}/export/json",
        headers=auth_headers,
    )
    assert response.status_code == 200
    assert response.headers["content-type"].startswith("application/json")


def test_export_invalid_format(client, auth_headers):
    evaluation = client.post(
        "/api/evaluations",
        headers=auth_headers,
        json={"prompt": "Test", "category": "Custom", "models": ["gpt-4"]},
    ).json()

    response = client.get(
        f"/api/evaluations/{evaluation['id']}/export/xml",
        headers=auth_headers,
    )
    assert response.status_code == 400


def test_delete_evaluation(client, auth_headers):
    evaluation = client.post(
        "/api/evaluations",
        headers=auth_headers,
        json={"prompt": "Delete me", "category": "Custom", "models": ["gpt-4"]},
    ).json()

    response = client.delete(
        f"/api/evaluations/{evaluation['id']}",
        headers=auth_headers,
    )
    assert response.status_code == 204

    get_response = client.get(
        f"/api/evaluations/{evaluation['id']}",
        headers=auth_headers,
    )
    assert get_response.status_code == 404

