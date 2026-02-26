const rawApiUrl = process.env.NEXT_PUBLIC_API_URL?.trim();
const API_URL = rawApiUrl
  ? rawApiUrl.replace(/\/+$/, "")
  : process.env.NODE_ENV === "development"
    ? "http://localhost:4000"
    : "";

let cachedCsrf = null;

function getApiUrl(path) {
  if (!API_URL) {
    throw new Error("NEXT_PUBLIC_API_URL is not set. Configure it in your deployment environment.");
  }
  return `${API_URL}${path}`;
}

async function fetchCsrf() {
  const res = await fetch(getApiUrl("/api/csrf"), {
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
  const url = getApiUrl(path);
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
