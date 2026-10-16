import VideoThumbnail from "./VideoThumbnail.jsx";
import { isUploadedVideo } from "./mediaUrls.js";

export default function VideoCardMedia({ video, onPlay, className = "thumbnail", showDuration = true, children }) {
  const content = <>
    <VideoThumbnail video={video} alt={video.title || "Wellness video"} />
    {isUploadedVideo(video) && <span className="video-media-play" aria-hidden="true"><i className="fa-solid fa-play" /></span>}
    {showDuration && <span className="duration">{video.duration || "00:00"}</span>}
    {children}
  </>;

  if (isUploadedVideo(video)) {
    return <button className={`${className} video-media-button`} type="button" onClick={() => onPlay?.(video)} aria-label={`Play ${video.title || "wellness video"}`}>
      {content}
    </button>;
  }

  return <a className={className} href={video.videoLink || "#"} target="_blank" rel="noopener noreferrer">
    {content}
  </a>;
}
