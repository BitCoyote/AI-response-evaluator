# AI Response Evaluator

A production-quality full-stack SaaS application for evaluating and comparing AI-generated responses from multiple Large Language Models (GPT-4, Claude, Gemini).

![Stack](https://img.shields.io/badge/React-19-blue) ![Stack](https://img.shields.io/badge/FastAPI-0.115-green) ![Stack](https://img.shields.io/badge/TypeScript-5.8-blue) ![Stack](https://img.shields.io/badge/Tailwind-4-blue)

## Features

- **Multi-Model Evaluation** — Send prompts to GPT-4, Claude, and Gemini simultaneously
- **Automated Scoring** — 9 evaluation metrics (accuracy, completeness, reasoning, and more)
- **AI Analysis** — GPT-powered summary, strengths/weaknesses, and recommendations
- **Hallucination Detection** — Identifies unsupported facts, conflicts, and low-confidence statements
- **Prompt Optimizer** — Generate better, few-shot, chain-of-thought, and structured prompts
- **Prompt Library** — Save and categorize prompts (Coding, Writing, Math, etc.)
- **Evaluation History** — Search, sort, filter, and re-open past evaluations
- **Analytics Dashboard** — Charts for model performance, categories, and trends
- **Export** — PDF, Markdown, CSV, and JSON export formats
- **Dark Mode** — Full dark/light theme support
- **JWT Authentication** — Secure local login system

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (React)                      │
│  Pages → Components → Context → API Client              │
└────────────────────────┬────────────────────────────────┘
                         │ REST API
┌────────────────────────▼────────────────────────────────┐
│                  Backend (FastAPI)                       │
│  Routes → Services → Repositories → Database (SQLite)   │
│                    ↕ AI Service                          │
│              OpenAI / Claude / Gemini APIs               │
└─────────────────────────────────────────────────────────┘
```

### Clean Architecture Layers

| Layer | Responsibility |
|-------|---------------|
| **API Routes** | HTTP handling, validation, rate limiting |
| **Services** | Business logic, AI orchestration |
| **Repositories** | Data access abstraction |
| **Domain** | Entities, enums, core types |
| **Schemas** | Pydantic request/response models |

## Project Structure

```
├── frontend/                 # React + TypeScript + TailwindCSS + Vite
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   ├── context/          # Auth & Theme providers
│   │   ├── lib/              # API client & utilities
│   │   ├── pages/            # Route pages
│   │   └── types/            # TypeScript interfaces
│   └── Dockerfile
├── backend/                  # Python FastAPI
│   ├── app/
│   │   ├── api/routes/       # REST endpoints
│   │   ├── core/             # Config, security, logging
│   │   ├── db/               # SQLAlchemy models
│   │   ├── domain/           # Enums & domain types
│   │   ├── repositories/     # Data access layer
│   │   ├── schemas/          # Pydantic schemas
│   │   └── services/         # Business logic & AI
│   ├── tests/
│   └── Dockerfile
├── docker-compose.yml
└── .github/workflows/ci.yml
```

## Installation

### Prerequisites

- Node.js 20+
- Python 3.12+
- OpenAI API key (optional — demo mode works without it)

### Quick Start (from root)

```bash
# Install frontend dependencies
cd frontend && npm install && cd ..

# Install backend dependencies
cd backend && pip install -r requirements.txt && cd ..

# Seed sample data
npm run seed

# Run both servers (requires: npm install at root for concurrently)
npm install
npm run dev
```

### Backend Setup

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate

# macOS/Linux
source venv/bin/activate

pip install -r requirements.txt
cp .env.example .env
# Edit .env with your API keys

# Seed sample data
python seed_data.py

# Start server
uvicorn app.main:app --reload --port 8000
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173

### Demo Account

After running `seed_data.py`:

- **Email:** demo@evaluator.ai
- **Password:** demo1234

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `SECRET_KEY` | JWT signing key | Yes (production) |
| `OPENAI_API_KEY` | OpenAI API key for GPT-4 & evaluation | Recommended |
| `ANTHROPIC_API_KEY` | Claude API key | Optional |
| `GOOGLE_API_KEY` | Gemini API key | Optional |
| `DATABASE_URL` | SQLite connection string | No (default provided) |
| `CORS_ORIGINS` | Allowed frontend origins | No |
| `DEBUG` | Enable debug mode | No |
| `LOG_LEVEL` | Logging level | No |

## API Documentation

With the backend running, visit:

- **Swagger UI:** http://localhost:8000/docs
- **ReDoc:** http://localhost:8000/redoc

### Key Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Get JWT token |
| POST | `/api/evaluations` | Run evaluation |
| GET | `/api/evaluations` | List history |
| GET | `/api/evaluations/{id}` | Get evaluation |
| GET | `/api/evaluations/analytics` | Analytics data |
| GET | `/api/evaluations/{id}/export/{fmt}` | Export (pdf/md/csv/json) |
| POST | `/api/prompts/optimize` | Optimize prompt |
| CRUD | `/api/prompts` | Prompt library |

## Docker

```bash
# Start everything
docker-compose up --build

# Frontend: http://localhost:5173
# Backend:  http://localhost:8000
# API Docs: http://localhost:8000/docs
```

## Testing

### Backend

```bash
cd backend
pytest -v
```

### Frontend

```bash
cd frontend
npm install
npm run dev        # Development server
npm run test       # Unit tests (Vitest)
npm run build      # Production build
```

## Deployment

### Frontend — Vercel

1. Connect your GitHub repository to Vercel
2. Set root directory to `frontend`
3. Build command: `npm run build`
4. Output directory: `dist`
5. Add environment variable for API URL if needed

### Backend — Render

1. Create a new Web Service on Render
2. Set root directory to `backend`
3. Build command: `pip install -r requirements.txt`
4. Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
5. Add environment variables from `.env.example`
6. Update `CORS_ORIGINS` to include your Vercel domain

## License

MIT
