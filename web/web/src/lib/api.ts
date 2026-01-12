import { getToken } from './auth';

const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

type ApiOptions = Omit<RequestInit, 'body'> & {
  body?: unknown;
};

export async function apiFetch<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const token = getToken();
  const headers = new Headers(options.headers || {});
  let body = options.body;

  if (body && typeof body === 'object' && !(body instanceof FormData)) {
    headers.set('content-type', 'application/json');
    body = JSON.stringify(body);
  }

  if (token) {
    headers.set('authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers,
    body: body as BodyInit | null | undefined,
  });

  const contentType = response.headers.get('content-type') || '';
  const payload = contentType.includes('application/json')
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const message = typeof payload === 'string' ? payload : payload?.message;
    throw new Error(message || 'Erro na requisicao');
  }

  return payload as T;
}
