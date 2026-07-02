import json
import logging
import time
from typing import Any

import httpx
from openai import OpenAI

from app.core.config import get_settings

logger = logging.getLogger(__name__)

MODEL_CONFIG = {
    "gpt-4": {"provider": "openai", "display": "GPT-4"},
    "claude-3-5-sonnet": {"provider": "anthropic", "display": "Claude 3.5 Sonnet"},
    "gemini-1.5-pro": {"provider": "google", "display": "Gemini 1.5 Pro"},
}


class AIService:
    def __init__(self):
        self.settings = get_settings()
        self.openai_client = (
            OpenAI(api_key=self.settings.openai_api_key) if self.settings.openai_api_key else None
        )

    async def generate_response(
        self,
        model: str,
        prompt: str,
        system_prompt: str | None = None,
        temperature: float = 0.7,
        max_tokens: int = 1024,
    ) -> dict[str, Any]:
        config = MODEL_CONFIG.get(model)
        if not config:
            raise ValueError(f"Unknown model: {model}")

        start = time.time()
        provider = config["provider"]

        if provider == "openai":
            content = await self._call_openai(prompt, system_prompt, temperature, max_tokens, model)
        elif provider == "anthropic":
            content = await self._call_anthropic(prompt, system_prompt, temperature, max_tokens)
        elif provider == "google":
            content = await self._call_gemini(prompt, system_prompt, temperature, max_tokens)
        else:
            raise ValueError(f"Unknown provider: {provider}")

        latency_ms = int((time.time() - start) * 1000)
        return {
            "model_name": config["display"],
            "provider": provider,
            "content": content,
            "latency_ms": latency_ms,
        }

    async def _call_openai(
        self, prompt: str, system_prompt: str | None, temperature: float, max_tokens: int, model: str
    ) -> str:
        if not self.openai_client:
            return self._mock_response("GPT-4", prompt)

        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})

        response = self.openai_client.chat.completions.create(
            model="gpt-4o-mini" if model == "gpt-4" else model,
            messages=messages,
            temperature=temperature,
            max_tokens=max_tokens,
        )
        return response.choices[0].message.content or ""

    async def _call_anthropic(
        self, prompt: str, system_prompt: str | None, temperature: float, max_tokens: int
    ) -> str:
        if not self.settings.anthropic_api_key:
            return self._mock_response("Claude", prompt)

        async with httpx.AsyncClient(timeout=60.0) as client:
            payload: dict[str, Any] = {
                "model": "claude-3-5-sonnet-20241022",
                "max_tokens": max_tokens,
                "temperature": temperature,
                "messages": [{"role": "user", "content": prompt}],
            }
            if system_prompt:
                payload["system"] = system_prompt

            response = await client.post(
                "https://api.anthropic.com/v1/messages",
                headers={
                    "x-api-key": self.settings.anthropic_api_key,
                    "anthropic-version": "2023-06-01",
                    "content-type": "application/json",
                },
                json=payload,
            )
            response.raise_for_status()
            data = response.json()
            return data["content"][0]["text"]

    async def _call_gemini(
        self, prompt: str, system_prompt: str | None, temperature: float, max_tokens: int
    ) -> str:
        if not self.settings.google_api_key:
            return self._mock_response("Gemini", prompt)

        full_prompt = f"{system_prompt}\n\n{prompt}" if system_prompt else prompt
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key={self.settings.google_api_key}",
                json={
                    "contents": [{"parts": [{"text": full_prompt}]}],
                    "generationConfig": {
                        "temperature": temperature,
                        "maxOutputTokens": max_tokens,
                    },
                },
            )
            response.raise_for_status()
            data = response.json()
            return data["candidates"][0]["content"]["parts"][0]["text"]

    def _mock_response(self, model_name: str, prompt: str) -> str:
        return (
            f"[{model_name} Demo Response - Configure API key for live responses]\n\n"
            f"Based on your prompt: \"{prompt[:200]}{'...' if len(prompt) > 200 else ''}\"\n\n"
            f"This is a simulated response from {model_name}. In production, this would be "
            f"generated by the actual model API. The response demonstrates structured reasoning, "
            f"factual accuracy, and adherence to the given instructions."
        )

    async def evaluate_responses(
        self, prompt: str, responses: list[dict[str, Any]], system_prompt: str | None = None
    ) -> dict[str, Any]:
        if not self.openai_client:
            return self._mock_evaluation(responses)

        eval_prompt = self._build_evaluation_prompt(prompt, responses, system_prompt)
        response = self.openai_client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are an expert AI response evaluator. Return ONLY valid JSON "
                        "matching the requested schema. Be rigorous and objective."
                    ),
                },
                {"role": "user", "content": eval_prompt},
            ],
            temperature=0.3,
            response_format={"type": "json_object"},
        )
        content = response.choices[0].message.content or "{}"
        return json.loads(content)

    def _build_evaluation_prompt(
        self, prompt: str, responses: list[dict[str, Any]], system_prompt: str | None
    ) -> str:
        responses_text = "\n\n".join(
            f"### {r['model_name']} ({r['provider']})\n{r['content']}" for r in responses
        )
        return f"""Evaluate the following AI model responses to this prompt.

ORIGINAL PROMPT:
{prompt}

SYSTEM PROMPT:
{system_prompt or "None"}

RESPONSES:
{responses_text}

Return JSON with this exact structure:
{{
  "responses": [
    {{
      "model_name": "string",
      "scores": {{
        "accuracy": 0-100,
        "completeness": 0-100,
        "reasoning": 0-100,
        "instruction_following": 0-100,
        "safety": 0-100,
        "conciseness": 0-100,
        "readability": 0-100,
        "hallucination_risk": 0-100,
        "overall": 0-100
      }},
      "hallucination_analysis": {{
        "unsupported_facts": [{{"text": "", "type": "unsupported_fact", "confidence": "high|medium|low", "explanation": ""}}],
        "conflicting_info": [{{"text": "", "type": "conflicting_info", "confidence": "high|medium|low", "explanation": ""}}],
        "low_confidence": [{{"text": "", "type": "low_confidence", "confidence": "high|medium|low", "explanation": ""}}],
        "possible_hallucinations": [{{"text": "", "type": "possible_hallucination", "confidence": "high|medium|low", "explanation": ""}}]
      }}
    }}
  ],
  "analysis": {{
    "summary": "comprehensive summary",
    "strengths": ["strength1", "strength2"],
    "weaknesses": ["weakness1", "weakness2"],
    "best_response": "model name",
    "recommended_improvements": ["improvement1"],
    "prompt_optimization_suggestions": ["suggestion1"]
  }}
}}"""

    def _mock_evaluation(self, responses: list[dict[str, Any]]) -> dict[str, Any]:
        import random

        result_responses = []
        for i, r in enumerate(responses):
            base = 70 + random.randint(0, 25) - i * 3
            scores = {
                "accuracy": min(100, base + random.randint(-5, 10)),
                "completeness": min(100, base + random.randint(-5, 10)),
                "reasoning": min(100, base + random.randint(-5, 10)),
                "instruction_following": min(100, base + random.randint(-5, 10)),
                "safety": min(100, 90 + random.randint(-5, 10)),
                "conciseness": min(100, base + random.randint(-10, 5)),
                "readability": min(100, base + random.randint(-5, 10)),
                "hallucination_risk": max(0, 30 - i * 5 + random.randint(-5, 10)),
                "overall": 0,
            }
            scores["overall"] = round(sum(scores.values()) / len(scores), 1)
            result_responses.append(
                {
                    "model_name": r["model_name"],
                    "scores": scores,
                    "hallucination_analysis": {
                        "unsupported_facts": [],
                        "conflicting_info": [],
                        "low_confidence": [
                            {
                                "text": "Demo mode - configure OpenAI API key for real analysis",
                                "type": "low_confidence",
                                "confidence": "medium",
                                "explanation": "Running in demo mode without API key",
                            }
                        ],
                        "possible_hallucinations": [],
                    },
                }
            )

        best = max(result_responses, key=lambda x: x["scores"]["overall"])
        return {
            "responses": result_responses,
            "analysis": {
                "summary": "Demo evaluation completed. Configure your OpenAI API key for AI-powered analysis.",
                "strengths": ["Responses generated successfully", "All models completed within expected time"],
                "weaknesses": ["Running in demo mode - limited analysis depth"],
                "best_response": best["model_name"],
                "recommended_improvements": [
                    "Add OpenAI API key for comprehensive evaluation",
                    "Try more specific prompts for better comparison",
                ],
                "prompt_optimization_suggestions": [
                    "Add context and constraints to your prompt",
                    "Specify the desired output format",
                ],
            },
        }

    async def optimize_prompt(
        self, prompt: str, system_prompt: str | None = None, category: str = "Custom"
    ) -> dict[str, str]:
        if not self.openai_client:
            return self._mock_optimize(prompt)

        optimize_prompt = f"""Optimize this prompt for the category: {category}

ORIGINAL PROMPT:
{prompt}

SYSTEM PROMPT:
{system_prompt or "None"}

Return JSON with:
{{
  "better_prompt": "improved version",
  "few_shot_prompt": "version with examples",
  "chain_of_thought_prompt": "version encouraging step-by-step reasoning",
  "structured_prompt": "version with clear sections and format"
}}"""

        response = self.openai_client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are a prompt engineering expert. Return ONLY valid JSON."},
                {"role": "user", "content": optimize_prompt},
            ],
            temperature=0.5,
            response_format={"type": "json_object"},
        )
        return json.loads(response.choices[0].message.content or "{}")

    def _mock_optimize(self, prompt: str) -> dict[str, str]:
        return {
            "better_prompt": f"Please provide a detailed, well-structured response to the following:\n\n{prompt}\n\nEnsure accuracy and cite sources where applicable.",
            "few_shot_prompt": f"Example 1:\nQ: What is machine learning?\nA: Machine learning is...\n\nNow answer:\n{prompt}",
            "chain_of_thought_prompt": f"Think step by step before answering.\n\n{prompt}\n\nLet's approach this systematically:",
            "structured_prompt": f"## Task\n{prompt}\n\n## Requirements\n- Be accurate\n- Be concise\n- Use bullet points where appropriate\n\n## Output Format\nProvide your response in markdown format.",
        }
