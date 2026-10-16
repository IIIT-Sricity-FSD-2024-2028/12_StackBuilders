const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:3000").replace(/\/+$/, "");

async function request(path, options = {}) {
  const headers = new Headers(options.headers || {});
  headers.set("role", "Wellness Expert");
  const hasJson = Object.prototype.hasOwnProperty.call(options, "json");
  if (hasJson) headers.set("Content-Type", "application/json");
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
    body: hasJson ? JSON.stringify(options.json) : options.body,
  });
  const text = await response.text();
  let payload = null;
  if (text) {
    try { payload = JSON.parse(text); } catch { payload = text; }
  }
  if (!response.ok) {
    const detail = payload?.message;
    const message = Array.isArray(detail) ? detail.join(" ") : typeof detail === "string" ? detail : detail?.message || payload?.error;
    const error = new Error(message || `Request failed with status ${response.status}.`);
    error.status = response.status;
    throw error;
  }
  return payload;
}

function queryString(params) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).trim()) query.set(key, String(value));
  });
  return query.size ? `?${query}` : "";
}

const expertApi = {
  getConsultations: (expert) => request(`/consultations${queryString({ expertId: expert?.id, companyId: expert?.companyId, companyName: expert?.companyName })}`),
  updateConsultation: (id, changes) => request(`/consultations/${encodeURIComponent(id)}`, { method: "PATCH", json: changes }),
  createFollowUpConsultation: (payload) => request("/consultations/follow-up", { method: "POST", json: payload }),
  getExpert: (id) => request(`/experts/${encodeURIComponent(id)}`),
  updateExpert: (id, changes) => request(`/experts/${encodeURIComponent(id)}`, { method: "PATCH", json: changes }),
  getLiveSessions: (expert) => request(`/live-sessions${queryString({ expertId: expert?.id, companyId: expert?.companyId, companyName: expert?.companyName })}`),
  createLiveSession: (payload) => request("/live-sessions", { method: "POST", json: payload }),
  updateLiveSession: (id, changes) => request(`/live-sessions/${encodeURIComponent(id)}`, { method: "PATCH", json: changes }),
  getCheckins: (expert) => request(`/wellness-checkins${queryString({ companyId: expert?.companyId, companyName: expert?.companyName })}`),
  getCheckinResponses: (expert) => request(`/checkin-responses${queryString({ companyId: expert?.companyId, companyName: expert?.companyName })}`),
  createCheckinResponse: (payload) => request("/checkin-responses", { method: "POST", json: payload }),
  getVideos: (expert) => request(`/videos${queryString({ companyId: expert?.companyId, companyName: expert?.companyName })}`),
  createVideo: (payload, files = {}) => {
    if (!files.videoFile && !files.thumbnailFile) {
      return request("/videos", { method: "POST", json: payload });
    }
    const body = new FormData();
    Object.entries(payload).forEach(([key, value]) => {
      if (value !== undefined && value !== null) body.append(key, String(value));
    });
    if (files.videoFile) body.append("videoFile", files.videoFile);
    if (files.thumbnailFile) body.append("thumbnailFile", files.thumbnailFile);
    return request("/videos", { method: "POST", body });
  },
  deleteVideo: (id, expertId) => request(`/videos/${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: expertId ? { "x-expert-id": expertId } : {},
  }),
};

export default expertApi;
