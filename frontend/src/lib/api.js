const backendUrl = import.meta.env.VITE_BACKEND_URL || '';

export function getBackendUrl() {
  return backendUrl;
}

export function getAuthHeaders() {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function apiFetch(path, options = {}) {
  const url = `${backendUrl}${path}`;
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  const res = await fetch(url, {
    ...options,
    headers,
  });

  const text = await res.text();
  let data = null;
  
  try {
    data = text ? JSON.parse(text) : null;
  } catch (parseError) {
    console.error('Failed to parse JSON response:', text);
    // If parsing fails, treat it as error regardless of status
    const error = /** @type {any} */ (new Error('Invalid JSON response from server'));
    Object.assign(error, { status: res.status, rawText: text, parseError });
    throw error;
  }

  if (!res.ok) {
    const message = (data && data.error && data.error.message) || (data && data.message) || res.statusText;
    const error = /** @type {any} */ (new Error(message));
    Object.assign(error, { status: res.status, data });
    throw error;
  }

  return data;
}

export async function apiGet(path, query) {
  const base = backendUrl || window.location.origin;
  const url = new URL(`${base}${path}`);
  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null) url.searchParams.set(key, String(value));
    });
  }
  const res = await fetch(url.toString(), {
    headers: getAuthHeaders(),
  });
  const text = await res.text();
  let data = null;
  
  try {
    data = text ? JSON.parse(text) : null;
  } catch (parseError) {
    console.error('Failed to parse JSON response:', text);
    // If parsing fails, treat it as error regardless of status
    const error = /** @type {any} */ (new Error('Invalid JSON response from server'));
    Object.assign(error, { status: res.status, rawText: text, parseError });
    throw error;
  }

  if (!res.ok) {
    const message = (data && data.error && data.error.message) || (data && data.message) || res.statusText;
    const error = /** @type {any} */ (new Error(message));
    Object.assign(error, { status: res.status, data });
    throw error;
  }

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
