const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

if (!API_BASE_URL) {
  // In development, we might not have it set, but for production it's critical.
  console.warn("NEXT_PUBLIC_API_BASE_URL is not set");
}

function getAuthHeader() {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("authToken");
    if (token) {
      return { Authorization: `Bearer ${token}` };
    }
  }
  return {};
}

/**
 * Główny klient REST dla ApiaryMind
 */
export async function apiGet(path: string, options: RequestInit = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...getAuthHeader(),
    ...(options.headers || {}),
  };

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`API error: ${res.status} - ${res.statusText}`);
  }

  return res.json();
}

export async function apiPost(path: string, body: any, options: RequestInit = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...getAuthHeader(),
    ...(options.headers || {}),
  };

  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    ...options,
    headers,
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(`API POST error: ${res.status} - ${res.statusText}`);
  }

  return res.json();
}

export async function apiPut(path: string, body: any, options: RequestInit = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...getAuthHeader(),
    ...(options.headers || {}),
  };

  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: "PUT",
    ...options,
    headers,
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(`API PUT error: ${res.status} - ${res.statusText}`);
  }

  return res.json();
}

export async function apiDelete(path: string, options: RequestInit = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...getAuthHeader(),
    ...(options.headers || {}),
  };

  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: "DELETE",
    ...options,
    headers,
  });

  if (!res.ok) {
    throw new Error(`API DELETE error: ${res.status} - ${res.statusText}`);
  }

  return res.json();
}
