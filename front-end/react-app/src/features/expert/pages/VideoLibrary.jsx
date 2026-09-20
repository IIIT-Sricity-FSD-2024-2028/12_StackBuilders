import { useState } from "react";
import ExpertIcon from "../components/ExpertIcon.jsx";
import { VideoCategory, VideoModal, videoCategories } from "../components/ExpertFeatureComponents.jsx";

function VideoLibrary({ data, onCreateVideo }) {
  const [query, setQuery] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const normalizedQuery = query.trim().toLowerCase();
  const matchedVideos = data.videos.filter((video) => !normalizedQuery || `${video.title} ${video.description}`.toLowerCase().includes(normalizedQuery));

  return <><section className="expert-page-heading expert-video-heading"><div><p className="expert-eyebrow">Expert video library</p><h1>Video Library</h1><p>Explore wellness videos curated for a healthier and more sustainable workday.</p></div><button className="expert-primary-button" type="button" onClick={() => setModalOpen(true)}><ExpertIcon name="plus" size={17} /> Add video</button></section><section className="expert-search-panel"><label><ExpertIcon name="search" size={18} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search for videos..." /></label><span>{matchedVideos.length} video{matchedVideos.length === 1 ? "" : "s"} found</span></section>{videoCategories.map((category) => <VideoCategory category={category} key={category[0]} videos={matchedVideos.filter((video) => video.category === category[0])} />)}{!matchedVideos.length && <section className="expert-empty expert-search-empty"><ExpertIcon name="search" size={25} /><p>No videos match “{query}”. Try a different title or topic.</p></section>}{modalOpen && <VideoModal onClose={() => setModalOpen(false)} onCreate={onCreateVideo} />}</>;
}

export default VideoLibrary;
