export interface User {
  id: number;
  email: string;
  username: string;
  full_name: string | null;
  dark_mode: boolean;
  created_at: string;
}

export interface ScoreMetrics {
  accuracy: number;
  completeness: number;
  reasoning: number;
  instruction_following: number;
  safety: number;
  conciseness: number;
  readability: number;
  hallucination_risk: number;
  overall: number;
}

export interface HallucinationItem {
  text: string;
  type: string;
  confidence: string;
  explanation: string;
}

export interface HallucinationAnalysis {
  unsupported_facts: HallucinationItem[];
  conflicting_info: HallucinationItem[];
  low_confidence: HallucinationItem[];
  possible_hallucinations: HallucinationItem[];
}

export interface ModelResponse {
  id: number;
  model_name: string;
  provider: string;
  content: string;
  latency_ms: number;
  scores: ScoreMetrics;
  hallucination_analysis: HallucinationAnalysis;
}

export interface EvaluationAnalysis {
  summary: string;
  strengths: string[];
  weaknesses: string[];
  best_response: string;
  recommended_improvements: string[];
  prompt_optimization_suggestions: string[];
}

export interface Evaluation {
  id: number;
  title: string;
  prompt: string;
  system_prompt: string | null;
  category: string;
  temperature: number;
  max_tokens: number;
  models_used: string[];
  status: string;
  analysis: EvaluationAnalysis | null;
  created_at: string;
  responses: ModelResponse[];
}

export interface EvaluationListItem {
  id: number;
  title: string;
  prompt: string;
  category: string;
  models_used: string[];
  status: string;
  created_at: string;
}

export interface PromptLibraryItem {
  id: number;
  title: string;
  prompt: string;
  system_prompt: string | null;
  category: string;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface DashboardStats {
  total_evaluations: number;
  total_prompts: number;
  avg_overall_score: number;
  recent_evaluations: EvaluationListItem[];
}

export interface Analytics {
  total_evaluations: number;
  average_model_scores: Record<string, number>;
  most_accurate_model: string;
  average_hallucination_rate: number;
  prompt_categories: Record<string, number>;
  most_used_models: Record<string, number>;
  evaluations_over_time: { date: string; count: number }[];
  score_trends: Record<string, number[]>;
}

export interface PromptOptimizeResult {
  better_prompt: string;
  few_shot_prompt: string;
  chain_of_thought_prompt: string;
  structured_prompt: string;
}

export const PROMPT_CATEGORIES = [
  'Coding', 'Writing', 'Math', 'Research',
  'Data Analysis', 'Reasoning', 'Custom',
] as const;

export const AI_MODELS = [
  { id: 'gpt-4', name: 'GPT-4', provider: 'OpenAI', color: '#10a37f' },
  { id: 'claude-3-5-sonnet', name: 'Claude', provider: 'Anthropic', color: '#d97706' },
  { id: 'gemini-1.5-pro', name: 'Gemini', provider: 'Google', color: '#4285f4' },
] as const;

export const SCORE_METRICS = [
  { key: 'accuracy', label: 'Accuracy', color: '#6366f1' },
  { key: 'completeness', label: 'Completeness', color: '#8b5cf6' },
  { key: 'reasoning', label: 'Reasoning', color: '#a855f7' },
  { key: 'instruction_following', label: 'Instruction Following', color: '#d946ef' },
  { key: 'safety', label: 'Safety', color: '#22c55e' },
  { key: 'conciseness', label: 'Conciseness', color: '#14b8a6' },
  { key: 'readability', label: 'Readability', color: '#06b6d4' },
  { key: 'hallucination_risk', label: 'Hallucination Risk', color: '#ef4444', invert: true },
  { key: 'overall', label: 'Overall Score', color: '#6366f1' },
] as const;
