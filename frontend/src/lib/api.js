const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

let cachedCsrf = null;

async function fetchCsrf() {
  const res = await fetch(`${API_URL}/api/csrf`, {
    credentials: "include"
  });
  if (!res.ok) {
    throw new Error("CSRF fetch failed");
  }
  const data = await res.json();
  cachedCsrf = data.csrfToken;
  return cachedCsrf;
}

export async function apiFetch(path, options = {}) {
  const url = `${API_URL}${path}`;
  const opts = {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options
  };

  if (opts.method && opts.method !== "GET") {
    if (!cachedCsrf) {
      await fetchCsrf();
    }
    opts.headers["X-CSRF-Token"] = cachedCsrf;
  }

  const res = await fetch(url, opts);
  if (res.status === 403 && opts.method && opts.method !== "GET") {
    cachedCsrf = null;
  }
  if (!res.ok) {
    const message = await res.text();
    const error = new Error(message || "Request failed");
    error.status = res.status;
    throw error;
  }
  if (res.status === 204) return null;
  return res.json();
}
