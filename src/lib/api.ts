const API_URL = "https://maas-backend-rmbomgmltq-ew.a.run.app/api";

function getToken(): string | null {
  return localStorage.getItem("maas_token");
}

function authHeaders(): Record<string, string> {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
      ...options.headers,
    },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`API Error ${res.status}: ${text}`);
  }
  return res.json();
}

// Auth
export async function login(email: string, password: string) {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error("Invalid credentials");
  return res.json() as Promise<{ access_token: string; token_type: string; role: string }>;
}

export async function getMe() {
  return request<{
    id: string;
    email: string;
    full_name: string | null;
    role: string;
    is_active: boolean;
  }>("/auth/me");
}

// Projects
export async function getProjects() {
  return request<any[]>("/projects");
}

export async function getProject(id: string) {
  return request<any>(`/projects/${id}`);
}

export async function getProjectStatus(id: string) {
  return request<any>(`/projects/${id}/status`);
}

export async function createProject() {
  return request<any>("/projects", { method: "POST", body: JSON.stringify({}) });
}

// Conversations
export async function createConversation(
  projectId: string | null,
  agencyMode: boolean = true,
  targetAgent: string | null = "commercial"
) {
  return request<any>("/conversations", {
    method: "POST",
    body: JSON.stringify({
      project_id: projectId,
      agency_mode: agencyMode,
      target_agent: targetAgent,
    }),
  });
}

export async function getConversation(conversationId: string) {
  return request<any>(`/conversations/${conversationId}`);
}

export async function sendMessageSSE(
  conversationId: string,
  type: "text" | "quick_reply",
  value: string,
  hasFile: boolean = false
): Promise<ReadableStream<Uint8Array> | null> {
  const res = await fetch(`${API_URL}/conversations/${conversationId}/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "text/event-stream",
      ...authHeaders(),
    },
    body: JSON.stringify({ type, value, has_file: hasFile }),
  });
  if (!res.ok) throw new Error(`Message error ${res.status}`);
  return res.body;
}

// Validations
export async function approveValidation(id: string, feedback: string | null = null) {
  const res = await fetch(`${API_URL}/validations/${id}/approve`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "text/event-stream",
      ...authHeaders(),
    },
    body: JSON.stringify({ feedback }),
  });
  if (!res.ok) throw new Error("Validation error");
  return res.body;
}

export async function rejectValidation(id: string, feedback: string) {
  const res = await fetch(`${API_URL}/validations/${id}/reject`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "text/event-stream",
      ...authHeaders(),
    },
    body: JSON.stringify({ feedback }),
  });
  if (!res.ok) throw new Error("Validation error");
  return res.body;
}

// Brief
export async function getBrief(projectId: string) {
  return request<any>(`/projects/${projectId}/brief`);
}

// PPM
export async function getPPM(projectId: string) {
  return request<any>(`/projects/${projectId}/ppm`);
}

export async function approvePPMGate(projectId: string, action: "approve" | "revision", feedback: string = "") {
  return request<any>(`/projects/${projectId}/gates/ppm`, {
    method: "POST",
    body: JSON.stringify({ action, feedback }),
  });
}

// Assets
export async function getAssetAccessUrl(assetId: string) {
  return request<{ url: string }>(`/assets/${assetId}/access-url`);
}

export { API_URL, getToken, authHeaders };
