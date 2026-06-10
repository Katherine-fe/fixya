const TOKEN_KEY = "fixya_auth_token";

export function getBase(): string {
  return (import.meta.env.BASE_URL ?? "/").replace(/\/$/, "");
}

export async function authFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const token = localStorage.getItem(TOKEN_KEY);
  const headers: Record<string, string> = {
    ...(init.headers as Record<string, string>),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(init.body ? { "Content-Type": "application/json" } : {}),
  };
  return fetch(`${getBase()}${path}`, { ...init, headers });
}

export async function authJson<T = unknown>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await authFetch(path, init);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as any).error || `Error ${res.status}`);
  }
  return res.json() as Promise<T>;
}
