import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
});

// 请求拦截器：自动附带管理员 token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface Article {
  id: number;
  title: string;
  summary: string;
  content: string;
  cover_image?: string;
  created_at: string;
  updated_at: string;
}

// ─── 公开接口 ─────────────────────────────────────────────
export const getArticles = () => api.get<Article[]>('/articles');
export const getArticle = (id: number) => api.get<Article>(`/articles/${id}`);

// ─── 管理员接口 ───────────────────────────────────────────
export const adminLogin = (password: string) =>
  api.post<{ token: string }>('/auth/login', { password });

export const createArticle = (data: Partial<Article>) =>
  api.post<Article>('/articles', data);

export const updateArticle = (id: number, data: Partial<Article>) =>
  api.put<Article>(`/articles/${id}`, data);

export const deleteArticle = (id: number) =>
  api.delete(`/articles/${id}`);
