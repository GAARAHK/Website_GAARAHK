import axios from 'axios';

const api = axios.create({ baseURL: '/api', timeout: 10000 });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export interface Article {
  id: number;
  title: string;
  summary: string;
  content: string;
  cover_image?: string;
  category?: string;
  tags?: string; // JSON 字符串数组，如 '["Node.js","React"]'
  created_at: string;
  updated_at: string;
}

export interface PaginatedArticles {
  data: Article[];
  total: number;
  page: number;
  pages: number;
  limit: number;
}

export interface Category { category: string; count: number; }
export interface Tag      { name: string;     count: number; }

// ─── 公开接口 ─────────────────────────────────────────────
export const getArticles = (page = 1, limit = 10, category?: string) =>
  api.get<PaginatedArticles>('/articles', { params: { page, limit, category } });

/** 管理后台用：一次获取全部文章 */
export const getAllArticles = () =>
  api.get<PaginatedArticles>('/articles', { params: { page: 1, limit: 9999 } });

export const getArticle = (id: number) => api.get<Article>(`/articles/${id}`);

export const searchArticles = (q: string) =>
  api.get<Article[]>('/articles/search', { params: { q } });

export const getCategories = () => api.get<Category[]>('/articles/categories');
export const getTags       = () => api.get<Tag[]>('/articles/tags');

// ─── 管理员接口 ───────────────────────────────────────────
export const adminLogin = (password: string) =>
  api.post<{ token: string }>('/auth/login', { password });

export const createArticle = (data: Partial<Article>) =>
  api.post<Article>('/articles', data);

export const updateArticle = (id: number, data: Partial<Article>) =>
  api.put<Article>(`/articles/${id}`, data);

export const deleteArticle = (id: number) => api.delete(`/articles/${id}`);

// ─── 个人信息接口 ─────────────────────────────────────────
export interface Profile {
  nickname: string;
  bio: string;
  avatar: string;
}

export const getProfile = () => api.get<Profile>('/profile');

export const updateProfile = (data: Profile) => api.put<Profile>('/profile', data);

// ─── 文件上传接口 ─────────────────────────────────────────
export const uploadFile = (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  return api.post<{ url: string; filename: string }>('/upload', formData);
};

export const getUploadList = () =>
  api.get<{ filename: string; url: string; size: number }[]>('/upload/list');
