import { getToken, getRefreshToken, clearAuth } from './auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public errors?: { field: string; message: string }[]
  ) {
    super(message);
  }
}

const FIELD_LABELS: Record<string, string> = {
  extinguisherId: 'Fire extinguisher',
  scheduledDate: 'Date',
  scheduledTime: 'Time',
  notes: 'Notes',
  serialNumber: 'Serial number',
  location: 'Location',
  email: 'Email',
  password: 'Password',
  firstName: 'First name',
  lastName: 'Last name',
};

/** Human-readable message including each field error from the API */
export function formatApiErrors(error: ApiError): string {
  if (error.errors?.length) {
    return error.errors
      .map(({ field, message }) => {
        const label = FIELD_LABELS[field] || field.replace(/([A-Z])/g, ' $1').trim();
        return `${label}: ${message}`;
      })
      .join(' · ');
  }
  return error.message;
}

/** Map API validation errors onto react-hook-form fields */
export function applyApiFieldErrors<T extends Record<string, unknown>>(
  error: ApiError,
  setFieldError: (name: keyof T & string, error: { message: string }) => void
) {
  error.errors?.forEach(({ field, message }) => {
    setFieldError(field as keyof T & string, { message });
  });
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  auth = true
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (auth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, { ...options, headers });
  } catch {
    throw new ApiError(
      'Cannot reach API. Is the backend running on http://localhost:4000?',
      0
    );
  }

  if (res.status === 401 && auth) {
    clearAuth();
    if (typeof window !== 'undefined') window.location.href = '/login';
    throw new ApiError('Unauthorized', 401);
  }

  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/pdf') || contentType.includes('text/csv')) {
    return res as unknown as T;
  }

  const body = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new ApiError(
      body.message || 'Request failed',
      res.status,
      body.errors
    );
  }

  return body.data ?? body;
}

export const api = {
  get: <T>(path: string, auth = true) => request<T>(path, { method: 'GET' }, auth),
  post: <T>(path: string, data?: unknown, auth = true) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(data) }, auth),
  put: <T>(path: string, data?: unknown, auth = true) =>
    request<T>(path, { method: 'PUT', body: JSON.stringify(data) }, auth),
  patch: <T>(path: string, data?: unknown, auth = true) =>
    request<T>(path, { method: 'PATCH', body: JSON.stringify(data) }, auth),
  delete: <T>(path: string, auth = true) => request<T>(path, { method: 'DELETE' }, auth),

  async download(path: string, filename: string) {
    const token = getToken();
    const res = await fetch(`${API_URL}${path}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) throw new ApiError('Download failed', res.status);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  },

  async logout() {
    const refreshToken = getRefreshToken();
    if (refreshToken) {
      try {
        await request('/auth/logout', {
          method: 'POST',
          body: JSON.stringify({ refreshToken }),
        }, false);
      } catch {
        /* ignore */
      }
    }
    clearAuth();
  },
};

export interface LoginResponse {
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: 'ADMIN' | 'INSPECTOR' | 'USER';
  };
  accessToken: string;
  refreshToken: string;
}
