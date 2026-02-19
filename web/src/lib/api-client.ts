import type { ApiError } from '@/types/api.types';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8800';

export class ApiClientError extends Error {
  public status: number;
  public code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = 'ApiClientError';
    this.status = status;
    this.code = code;
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorBody: ApiError = await response.json().catch(() => ({
      error: 'UNKNOWN_ERROR',
      message: response.statusText,
    }));
    throw new ApiClientError(response.status, errorBody.error, errorBody.message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

function buildUrl(path: string, params?: Record<string, string | number | undefined>): string {
  const url = new URL(`${BASE_URL}${path}`);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.append(key, String(value));
      }
    });
  }
  return url.toString();
}

function getHeaders(): HeadersInit {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  // 크로스 도메인 쿠키 실패 fallback: localStorage의 세션 토큰을 Bearer 헤더로 전송
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('session_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }
  return headers;
}

export const apiClient = {
  async get<T>(path: string, params?: Record<string, string | number | undefined>): Promise<T> {
    const url = buildUrl(path, params);
    const response = await fetch(url, {
      method: 'GET',
      headers: getHeaders(),
      credentials: 'include',
    });
    return handleResponse<T>(response);
  },

  async post<T>(path: string, body?: unknown): Promise<T> {
    const url = buildUrl(path);
    const response = await fetch(url, {
      method: 'POST',
      headers: getHeaders(),
      credentials: 'include',
      body: body ? JSON.stringify(body) : undefined,
    });
    return handleResponse<T>(response);
  },

  async put<T>(path: string, body?: unknown): Promise<T> {
    const url = buildUrl(path);
    const response = await fetch(url, {
      method: 'PUT',
      headers: getHeaders(),
      credentials: 'include',
      body: body ? JSON.stringify(body) : undefined,
    });
    return handleResponse<T>(response);
  },

  async delete<T>(path: string): Promise<T> {
    const url = buildUrl(path);
    const response = await fetch(url, {
      method: 'DELETE',
      headers: getHeaders(),
      credentials: 'include',
    });
    return handleResponse<T>(response);
  },
};
