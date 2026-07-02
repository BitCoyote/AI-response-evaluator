from enum import Enum


class AIModel(str, Enum):
    GPT4 = "gpt-4"
    CLAUDE = "claude-3-5-sonnet"
    GEMINI = "gemini-1.5-pro"


class PromptCategory(str, Enum):
    CODING = "Coding"
    WRITING = "Writing"
    MATH = "Math"
    RESEARCH = "Research"
    DATA_ANALYSIS = "Data Analysis"
    REASONING = "Reasoning"
    CUSTOM = "Custom"


class ExportFormat(str, Enum):
    PDF = "pdf"
    MARKDOWN = "markdown"
    CSV = "csv"
    JSON = "json"
