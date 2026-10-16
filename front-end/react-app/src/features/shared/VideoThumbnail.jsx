import { useState } from "react";
import { resolveMediaUrl } from "./mediaUrls.js";

const FALLBACK_THUMBNAIL = "/wellness-video-thumbnail.svg";

function getYouTubeThumbnail(videoLink) {
  try {
    const url = new URL(videoLink);
    let videoId = "";

    if (url.hostname === "youtu.be" || url.hostname.endsWith(".youtu.be")) {
      videoId = url.pathname.split("/").filter(Boolean)[0] || "";
    } else if (url.hostname.includes("youtube.com") || url.hostname.includes("youtube-nocookie.com")) {
      videoId = url.searchParams.get("v") || url.pathname.match(/^\/(?:embed|shorts|live)\/([^/?]+)/)?.[1] || "";
    }

    return videoId ? `https://img.youtube.com/vi/${encodeURIComponent(videoId)}/hqdefault.jpg` : "";
  } catch {
    return "";
  }
}

export default function VideoThumbnail({ video, className, alt }) {
  const candidates = [...new Set([
    resolveMediaUrl(video.thumbnailLink || video.thumbnailUrl || video.thumbnail),
    getYouTubeThumbnail(video.videoLink),
    FALLBACK_THUMBNAIL,
  ].filter(Boolean))];
  const [candidateIndex, setCandidateIndex] = useState(0);

  return (
    <img
      className={className}
      src={candidates[Math.min(candidateIndex, candidates.length - 1)]}
      alt={alt || video.title || "Wellness video"}
      loading="lazy"
      onError={() => setCandidateIndex((index) => Math.min(index + 1, candidates.length - 1))}
    />
  );
}
