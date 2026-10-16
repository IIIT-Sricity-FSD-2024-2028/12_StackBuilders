import { useEffect, useRef } from "react";
import { resolveMediaUrl } from "./mediaUrls.js";
import "./video-player.css";

export default function VideoPlayerModal({ video, onClose }) {
  const playerRef = useRef(null);

  useEffect(() => {
    if (!video) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    playerRef.current?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [video, onClose]);

  if (!video) return null;

  return <div className="video-player-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section className="video-player-dialog" role="dialog" aria-modal="true" aria-labelledby="videoPlayerTitle">
      <header className="video-player-header">
        <div><p>WELLNESS VIDEO</p><h2 id="videoPlayerTitle">{video.title || "Wellness video"}</h2></div>
        <button type="button" onClick={onClose} aria-label="Close video player">Close</button>
      </header>
      <video
        ref={playerRef}
        className="video-player-element"
        controls
        autoPlay
        playsInline
        preload="metadata"
        poster={resolveMediaUrl(video.thumbnailLink)}
        src={resolveMediaUrl(video.videoFileUrl)}
        tabIndex={0}
      >
        Your browser does not support MP4 video playback.
      </video>
      {video.description && <p className="video-player-description">{video.description}</p>}
    </section>
  </div>;
}
