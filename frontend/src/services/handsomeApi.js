function normalizeApiBaseUrl(baseUrl) {
  const normalizedBaseUrl = baseUrl.replace(/\/$/, "");
  return normalizedBaseUrl.endsWith("/api")
    ? `${normalizedBaseUrl}/v1`
    : normalizedBaseUrl;
}

const API_BASE_URL = normalizeApiBaseUrl(import.meta.env.VITE_API_URL || "/api/v1");
const AUTH_BASE_URL = `${API_BASE_URL}/auth`;

function getErrorMessage(payload, fallback) {
  if (!payload) return fallback;
  if (typeof payload === "string") return payload;
  if (typeof payload?.detail === "string") return payload.detail;
  if (typeof payload?.message === "string") return payload.message;
  if (typeof payload?.error === "string") return payload.error;
  return fallback;
}

async function parseResponse(response) {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

async function request(path, { token, headers, baseUrl = API_BASE_URL, ...options } = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(headers || {})
    },
    ...options
  });

  const payload = await parseResponse(response);
  if (!response.ok) {
    const error = new Error(getErrorMessage(payload, `Request failed: ${response.status}`));
    error.status = response.status;
    throw error;
  }

  return payload;
}

function normalizeUser(user) {
  return {
    id: Number(user.id),
    email: user.email,
    fullName: user.full_name || "",
    isActive: Boolean(user.is_active),
    isSuperuser: Boolean(user.is_superuser)
  };
}

function normalizeNote(note) {
  return {
    id: Number(note.id),
    title: note.title || "",
    content: note.content || "",
    createdAt: note.created_at || null,
    isFavorite: Boolean(note.is_favorite)
  };
}

export async function login({ email, password }) {
  const body = new URLSearchParams();
  body.set("username", email);
  body.set("password", password);

  return request("/login/access-token", {
    baseUrl: AUTH_BASE_URL,
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body
  });
}

export async function refreshAccessToken(refreshToken) {
  return request("/login/refresh-token", {
    baseUrl: AUTH_BASE_URL,
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: refreshToken })
  });
}

export async function logout(refreshToken) {
  return request("/login/logout", {
    baseUrl: AUTH_BASE_URL,
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: refreshToken })
  });
}

export async function sendRegistrationCode(email) {
  return request("/register/send-code", {
    baseUrl: AUTH_BASE_URL,
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email })
  });
}

export async function registerUser({ email, password, confirmPassword, code, fullName }) {
  const payload = await request("/register/", {
    baseUrl: AUTH_BASE_URL,
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email,
      password,
      confirm_password: confirmPassword,
      code,
      full_name: fullName || null
    })
  });
  return normalizeUser(payload);
}

export async function fetchUsers(token) {
  const payload = await request("/users/", { token });
  return (payload?.users || []).map(normalizeUser);
}

export async function createUser(token, { email, password, fullName, isSuperuser }) {
  const payload = await request("/users/", {
    method: "POST",
    token,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email,
      password,
      full_name: fullName || null,
      is_superuser: isSuperuser
    })
  });
  return normalizeUser(payload);
}

export async function deleteUser(token, userId) {
  await request(`/users/${userId}`, { method: "DELETE", token });
}

export async function fetchNotes(token) {
  const payload = await request("/notes/", { token });
  return (payload?.notes || []).map(normalizeNote);
}

export async function createNote(token, { title, content }) {
  const payload = await request("/notes/", {
    method: "POST",
    token,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, content })
  });
  return normalizeNote(payload);
}

export async function updateNote(token, noteId, { title, content }) {
  const payload = await request(`/notes/${noteId}`, {
    method: "PATCH",
    token,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, content })
  });
  return normalizeNote(payload);
}

export async function deleteNote(token, noteId) {
  await request(`/notes/${noteId}`, { method: "DELETE", token });
}

export async function favoriteNote(token, noteId) {
  const payload = await request(`/notes/${noteId}/favorite`, {
    method: "POST",
    token
  });
  return normalizeNote(payload);
}

export async function unfavoriteNote(token, noteId) {
  const payload = await request(`/notes/${noteId}/favorite`, {
    method: "DELETE",
    token
  });
  return normalizeNote(payload);
}
