const BASE = import.meta.env.VITE_API_BASE_URL;

let refreshing = null;

const refreshSession = () => {
  if (!refreshing) {
    refreshing = fetch(`${BASE}/auth/refresh`, {
      method: "POST",
      credentials: "include",
    })
      .then((r) => r.ok)
      .catch(() => false)
      .finally(() => {
        refreshing = null;
      });
  }
  return refreshing;
};

export async function api(
  path,
  { method = "GET", body, headers = {}, retry = true, raw = false } = {},
) {
  const isForm = body instanceof FormData;

  const res = await fetch(`${BASE}${path}`, {
    method,
    credentials: "include",
    headers: {
      ...(body && !isForm ? { "Content-Type": "application/json" } : {}),
      ...headers,
    },
    body: body ? (isForm ? body : JSON.stringify(body)) : undefined,
  });

  if (res.status === 401 && retry && !path.startsWith("/auth/")) {
    if (await refreshSession()) {
      return api(path, { method, body, headers, retry: false, raw });
    }
    window.dispatchEvent(new Event("auth:expired"));
  }

  const json = await res.json().catch(() => ({}));

  if (!res.ok) {
    const firstError = json.errors?.[0]?.msg;
    throw new Error(firstError || json.message || "Something went wrong");
  }

  return raw ? json : (json.data ?? json);
}
