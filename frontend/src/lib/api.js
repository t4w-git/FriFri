const backendUrl = import.meta.env.VITE_BACKEND_URL || '';

function buildApiUrl(path) {
  const baseUrl = backendUrl || window.location.origin;
  return new URL(path, `${baseUrl.replace(/\/+$/, '')}/`);
}

export function getBackendUrl() {
  return backendUrl;
}

export function getAuthHeaders() {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function parseResponse(res) {
  const text = await res.text();

  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch (parseError) {
    const contentType = res.headers.get('content-type') || 'content-type sconosciuto';
    const responseUrl = new URL(res.url || window.location.href);
    const endpoint = `${responseUrl.origin}${responseUrl.pathname}`;
    console.error('Failed to parse JSON response:', {
      url: endpoint,
      status: res.status,
      contentType,
      response: text,
    });
    const message = res.ok
      ? `Il server ha restituito ${contentType} invece di JSON per ${responseUrl.pathname}. Verifica che la richiesta API raggiunga il backend.`
      : `Server returned ${res.status}${res.statusText ? ` ${res.statusText}` : ''}`;
    const error = /** @type {any} */ (new Error(message));
    Object.assign(error, { status: res.status, rawText: text, parseError });
    throw error;
  }
}

function throwForResponseError(res, data) {
  if (res.ok) return;

  const message = (data && data.error && data.error.message) || (data && data.message) || res.statusText;
  const error = /** @type {any} */ (new Error(message));
  Object.assign(error, { status: res.status, data });
  throw error;
}

export async function apiFetch(path, options = {}) {
  const url = buildApiUrl(path);
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  const res = await fetch(url, {
    ...options,
    headers,
  });

  const data = await parseResponse(res);
  throwForResponseError(res, data);
  return data;
}

export async function apiGet(path, query) {
  const url = buildApiUrl(path);
  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null) url.searchParams.set(key, String(value));
    });
  }
  const res = await fetch(url.toString(), {
    headers: getAuthHeaders(),
  });
  const data = await parseResponse(res);
  throwForResponseError(res, data);
  return data;
}

export async function apiPost(path, body, options = {}) {
  return apiFetch(path, {
    method: 'POST',
    body: JSON.stringify(body),
    headers: path === '/api/v1/auth/login' ? {} : getAuthHeaders(),
    ...options,
  });
}

export async function apiPut(path, body, options = {}) {
  return apiFetch(path, {
    method: 'PUT',
    body: JSON.stringify(body),
    headers: getAuthHeaders(),
    ...options,
  });
}

export async function apiPatch(path, body, options = {}) {
  return apiFetch(path, {
    method: 'PATCH',
    body: JSON.stringify(body),
    headers: getAuthHeaders(),
    ...options,
  });
}

export async function apiDelete(path, options = {}) {
  return apiFetch(path, {
    method: 'DELETE',
    headers: getAuthHeaders(),
    ...options,
  });
}
