"""Seed the database with sample data for development."""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from app.core.security import get_password_hash
from app.db.database import Evaluation, ModelResponse, PromptLibraryItem, SessionLocal, User, init_db


def seed():
    init_db()
    db = SessionLocal()

    try:
        if db.query(User).filter(User.email == "demo@evaluator.ai").first():
            print("Sample data already exists. Skipping seed.")
            return

        user = User(
            email="demo@evaluator.ai",
            username="demo",
            full_name="Demo User",
            hashed_password=get_password_hash("demo1234"),
            dark_mode=True,
        )
        db.add(user)
        db.flush()

        prompts = [
            PromptLibraryItem(
                user_id=user.id,
                title="Explain Quantum Computing",
                prompt="Explain quantum computing in simple terms for a non-technical audience.",
                category="Research",
                tags=["science", "education"],
            ),
            PromptLibraryItem(
                user_id=user.id,
                title="Python Sorting Algorithm",
                prompt="Write a Python function to implement merge sort with detailed comments.",
                category="Coding",
                tags=["python", "algorithms"],
            ),
            PromptLibraryItem(
                user_id=user.id,
                title="Business Email Draft",
                prompt="Draft a professional email requesting a project deadline extension.",
                category="Writing",
                tags=["business", "email"],
            ),
        ]
        db.add_all(prompts)

        evaluation = Evaluation(
            user_id=user.id,
            title="Compare AI explanations of machine learning",
            prompt="What is machine learning and how does it differ from traditional programming?",
            system_prompt="You are a helpful AI educator. Be accurate and concise.",
            category="Research",
            temperature=0.7,
            max_tokens=512,
            models_used=["gpt-4", "claude-3-5-sonnet", "gemini-1.5-pro"],
            status="completed",
            analysis={
                "summary": "All models provided accurate explanations of machine learning fundamentals.",
                "strengths": ["Clear definitions", "Good use of examples", "Accurate technical content"],
                "weaknesses": ["Some responses could be more concise"],
                "best_response": "GPT-4",
                "recommended_improvements": ["Add specific use case examples"],
                "prompt_optimization_suggestions": ["Specify target audience level"],
            },
        )
        db.add(evaluation)
        db.flush()

        sample_responses = [
            ModelResponse(
                evaluation_id=evaluation.id,
                model_name="GPT-4",
                provider="openai",
                content="Machine learning is a subset of artificial intelligence where computers learn patterns from data rather than following explicitly programmed rules. Unlike traditional programming where developers write step-by-step instructions, ML systems improve their performance through experience with data.",
                latency_ms=1200,
                scores={
                    "accuracy": 92, "completeness": 88, "reasoning": 90,
                    "instruction_following": 95, "safety": 98, "conciseness": 85,
                    "readability": 93, "hallucination_risk": 8, "overall": 91.2,
                },
                hallucination_analysis={"unsupported_facts": [], "conflicting_info": [], "low_confidence": [], "possible_hallucinations": []},
            ),
            ModelResponse(
                evaluation_id=evaluation.id,
                model_name="Claude 3.5 Sonnet",
                provider="anthropic",
                content="Machine learning enables computers to learn from examples and make predictions or decisions without being explicitly programmed for each scenario. Traditional programming requires developers to define exact rules, while ML discovers patterns automatically from training data.",
                latency_ms=980,
                scores={
                    "accuracy": 90, "completeness": 86, "reasoning": 88,
                    "instruction_following": 92, "safety": 97, "conciseness": 90,
                    "readability": 91, "hallucination_risk": 10, "overall": 89.5,
                },
                hallucination_analysis={"unsupported_facts": [], "conflicting_info": [], "low_confidence": [], "possible_hallucinations": []},
            ),
            ModelResponse(
                evaluation_id=evaluation.id,
                model_name="Gemini 1.5 Pro",
                provider="google",
                content="Machine learning is an AI approach where algorithms improve through data exposure. In traditional programming, humans write explicit logic. In ML, the system learns optimal behavior by analyzing large datasets and identifying statistical patterns.",
                latency_ms=1100,
                scores={
                    "accuracy": 88, "completeness": 84, "reasoning": 86,
                    "instruction_following": 90, "safety": 96, "conciseness": 88,
                    "readability": 89, "hallucination_risk": 12, "overall": 87.1,
                },
                hallucination_analysis={"unsupported_facts": [], "conflicting_info": [], "low_confidence": [], "possible_hallucinations": []},
            ),
        ]
        db.add_all(sample_responses)
        db.commit()
        print("Sample data seeded successfully!")
        print("Login: demo@evaluator.ai / demo1234")

    finally:
        db.close()


if __name__ == "__main__":
    seed()
