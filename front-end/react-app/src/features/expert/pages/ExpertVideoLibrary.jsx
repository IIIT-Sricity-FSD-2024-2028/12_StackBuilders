import { useMemo, useState } from "react";
import ExpertIcon from "../components/ExpertIcon.jsx";

const categories = [
  ["Health Related", "Health Related Videos", "Nutrition, sleep, and healthy daily habits.", "heart", "coral"],
  ["Mind Relaxation", "Mind Relaxation Videos", "Calming routines, mindfulness, and stress relief.", "brain", "violet"],
  ["Physical Wellness", "Physical Wellness Videos", "Movement, mobility, stretching, and fitness routines.", "dumbbell", "mint"],
];

const initialForm = { title: "", category: "Health Related", duration: "", videoLink: "", description: "" };

function ExpertVideoLibrary({ data, onUpdate }) {
  const [query, setQuery] = useState("");
  const [slides, setSlides] = useState({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");

  const filteredVideos = useMemo(() => data.videos.filter((video) => {
    const search = query.trim().toLowerCase();
    return !search || [video.title, video.category, video.description].some((value) => String(value || "").toLowerCase().includes(search));
  }), [data.videos, query]);

  function moveCategory(category, direction, count) {
    setSlides((current) => {
      const page = current[category] || 0;
      return { ...current, [category]: Math.max(0, Math.min(page + direction, Math.max(0, Math.ceil(count / 3) - 1))) };
    });
  }

  function submitVideo(event) {
    event.preventDefault();
    if (!form.title.trim() || !form.category || !form.duration.trim() || !form.videoLink.trim() || !form.description.trim()) {
      setError("Please complete every video field before saving.");
      return;
    }
    onUpdate({ videos: [...data.videos, { ...form, id: `video-${Date.now()}`, accent: form.category === "Mind Relaxation" ? "violet" : form.category === "Physical Wellness" ? "mint" : "coral" }] });
    setForm(initialForm);
    setError("");
    setIsModalOpen(false);
  }

  return <div className="expert-video-page">
    <section className="expert-video-hero"><div><p className="expert-eyebrow">Expert Video Library</p><h1>Video Library</h1><p>Explore our collection of wellness videos curated for your health journey.</p></div><button className="expert-primary-button" type="button" onClick={() => setIsModalOpen(true)}><ExpertIcon name="plus" size={16} /> Add Video</button></section>
    <section className="expert-search-panel"><label><ExpertIcon name="search" size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search for videos..." aria-label="Search for videos" /></label><span>{filteredVideos.length} videos</span></section>
    {categories.map(([category, title, description, icon, accent]) => {
      const videos = filteredVideos.filter((video) => video.category === category);
      const page = slides[category] || 0;
      const visible = videos.slice(page * 3, page * 3 + 3);
      return <section className="expert-video-category" key={category} hidden={!videos.length}><header><div className="expert-title-with-icon"><span className={accent}><ExpertIcon name={icon} size={18} /></span><div><h2>{title}</h2><p>{description}</p></div></div><div className="expert-carousel-controls"><button type="button" disabled={page === 0} onClick={() => moveCategory(category, -1, videos.length)} aria-label={`Previous ${category} videos`}><ExpertIcon name="arrowLeft" size={15} /></button><button type="button" disabled={(page + 1) * 3 >= videos.length} onClick={() => moveCategory(category, 1, videos.length)} aria-label={`Next ${category} videos`}><ExpertIcon name="chevron" size={15} /></button></div></header><div className="expert-video-grid">{visible.map((video) => <article className="expert-video-card" key={video.id}><a href={video.videoLink || "#"} target="_blank" rel="noreferrer"><div className={`expert-video-art ${video.accent || accent}`}><span className="expert-video-badge">{video.category}</span><span className="expert-video-play"><ExpertIcon name="play" size={21} /></span><span className="expert-video-duration">{video.duration}</span></div><div className="expert-video-copy"><h3>{video.title}</h3><p>{video.description}</p><span><ExpertIcon name="user" size={12} /> Uploaded by {video.creatorExpertName || "Wellness Expert"}</span></div></a></article>)}</div></section>;
    })}
    {!filteredVideos.length && <section className="expert-panel expert-search-empty"><ExpertIcon name="search" size={20} /><p>No videos match your search.</p></section>}
    {isModalOpen && <div className="expert-modal-backdrop" role="presentation" onClick={(event) => { if (event.target === event.currentTarget) setIsModalOpen(false); }}><section className="expert-form-modal" role="dialog" aria-modal="true" aria-labelledby="expert-video-modal-title"><button className="expert-modal-close" type="button" onClick={() => setIsModalOpen(false)} aria-label="Close add video dialog"><ExpertIcon name="close" size={16} /></button><header><p className="expert-eyebrow">Video Library</p><h2 id="expert-video-modal-title">Add New Video</h2><p>Add the details for a new wellness video without leaving this page.</p></header><form onSubmit={submitVideo}><div className="expert-form-grid"><label className="wide">Video Title<input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="Enter video title" /></label><label>Category<select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}><option>Health Related</option><option>Mind Relaxation</option><option>Physical Wellness</option></select></label><label>Duration<input value={form.duration} onChange={(event) => setForm({ ...form, duration: event.target.value })} placeholder="12:45" /></label><label className="wide">Video Link<input type="url" value={form.videoLink} onChange={(event) => setForm({ ...form, videoLink: event.target.value })} placeholder="Paste YouTube or video URL" /></label><label className="wide">Description<textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} rows="4" placeholder="Write a short summary for this video." /></label></div>{error && <p className="expert-form-error">{error}</p>}<div className="expert-modal-actions"><button className="expert-secondary-button" type="button" onClick={() => setIsModalOpen(false)}>Cancel</button><button className="expert-primary-button" type="submit">Save Video</button></div></form></section></div>}
  </div>;
}

export default ExpertVideoLibrary;
