const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:3000").replace(/\/+$/, "");

export function resolveMediaUrl(value) {
  const url = String(value || "").trim();
  if (!url || /^(https?:|data:|blob:)/i.test(url)) return url;
  return url.startsWith("/") ? `${API_BASE_URL}${url}` : url;
}

export function isUploadedVideo(video) {
  return Boolean(video?.videoFileUrl);
}
