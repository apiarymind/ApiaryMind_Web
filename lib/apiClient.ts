const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

if (!API_BASE_URL) {
  throw new Error("NEXT_PUBLIC_API_BASE_URL is not set");
}

/**
 * Główny klient REST dla ApiaryMind (pasieki, ule, magazyn itd.)
 */
export async function apiGet(path: string, options: RequestInit = {}) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`API error: ${res.status} - ${res.statusText}`);
  }

  return res.json();
}

export async function apiPost(path: string, body: any, options: RequestInit = {}) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(`API POST error: ${res.status} - ${res.statusText}`);
  }

  return res.json();
}
