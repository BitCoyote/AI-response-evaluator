import axios from 'axios';
import type {
  Analytics,
  DashboardStats,
  Evaluation,
  EvaluationListItem,
  PromptLibraryItem,
  PromptOptimizeResult,
  User,
} from '../types';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  },
);

export const authApi = {
  register: (data: { email: string; username: string; password: string; full_name?: string }) =>
    api.post<User>('/auth/register', data),
  login: (data: { email: string; password: string }) =>
    api.post<{ access_token: string }>('/auth/login', data),
  me: () => api.get<User>('/auth/me'),
  updateSettings: (data: { full_name?: string; dark_mode?: boolean }) =>
    api.patch<User>('/auth/me', data),
};

export const evaluationApi = {
  create: (data: {
    prompt: string;
    system_prompt?: string;
    category: string;
    temperature: number;
    max_tokens: number;
    models: string[];
    title?: string;
  }) => api.post<Evaluation>('/evaluations', data),
  list: (params?: {
    search?: string;
    category?: string;
    sort_by?: string;
    sort_order?: string;
  }) => api.get<EvaluationListItem[]>('/evaluations', { params }),
  get: (id: number) => api.get<Evaluation>(`/evaluations/${id}`),
  delete: (id: number) => api.delete(`/evaluations/${id}`),
  dashboard: () => api.get<DashboardStats>('/evaluations/dashboard'),
  analytics: () => api.get<Analytics>('/evaluations/analytics'),
  export: (id: number, format: string) =>
    api.get(`/evaluations/${id}/export/${format}`, { responseType: 'blob' }),
};

export const promptApi = {
  list: (params?: { category?: string; search?: string }) =>
    api.get<PromptLibraryItem[]>('/prompts', { params }),
  create: (data: {
    title: string;
    prompt: string;
    system_prompt?: string;
    category: string;
    tags?: string[];
  }) => api.post<PromptLibraryItem>('/prompts', data),
  update: (id: number, data: Partial<PromptLibraryItem>) =>
    api.patch<PromptLibraryItem>(`/prompts/${id}`, data),
  delete: (id: number) => api.delete(`/prompts/${id}`),
  optimize: (data: { prompt: string; system_prompt?: string; category: string }) =>
    api.post<PromptOptimizeResult>('/prompts/optimize', data),
};

export default api;
