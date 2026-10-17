export const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8000";

export async function api(path, options = {}) {
  const headers = new Headers(options.headers || {});
  const hasBody = options.body !== undefined && options.body !== null;

  if (
    hasBody &&
    !(options.body instanceof FormData) &&
    !headers.has("Content-Type")
  ) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
    credentials: "include",
  });

  let data = null;
  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    data = await response.json();
  } else {
    data = await response.text();
  }

  if (!response.ok) {
    const message =
      data?.detail ||
      data?.message ||
      `Request failed (${response.status})`;

    const error = new Error(message);
    error.status = response.status;

    throw error;
  }

  return data;
}

export function authLogin(email, password) {
  const body = new URLSearchParams();

  body.set("username", email);
  body.set("password", password);

  return api("/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });
}

export const authMe = () => api("/auth/me");

export const logout = () =>
  api("/auth/logout", { method: "POST" });

export default api;
