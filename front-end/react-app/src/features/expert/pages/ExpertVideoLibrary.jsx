import { useEffect, useMemo, useRef, useState } from "react";
import { makeId } from "../expertData.js";
import VideoCardMedia from "../../shared/VideoCardMedia.jsx";
import VideoPlayerModal from "../../shared/VideoPlayerModal.jsx";

const categories = [
  ["Health Related", "health", "Health Related Videos", "Nutrition, sleep, and healthy daily habits.", "pink", "fa-heart-pulse"],
  ["Mind Relaxation", "mind", "Mind Relaxation Videos", "Calming routines, mindfulness, and stress relief.", "purple", "fa-brain"],
  ["Physical Wellness", "physical", "Physical Wellness Videos", "Movement, mobility, stretching, and fitness routines.", "green", "fa-dumbbell"],
];

const initialForm = { title: "", duration: "", videoSource: "upload", videoLink: "", videoFile: null, thumbnailSource: "upload", thumbnailLink: "", thumbnailFile: null, generatedThumbnailFile: null, description: "" };
const secondOptions = Array.from({ length: 60 }, (_, value) => String(value).padStart(2, "0"));

function getCardsPerView() {
  if (typeof window === "undefined" || window.innerWidth <= 700) return 1;
  if (window.innerWidth <= 1100) return 2;
  return 3;
}

function categoryForSpecialization(specialization) {
  const value = String(specialization || "").trim().toLowerCase();
  if (/nutrition|diet|health related/.test(value)) return "Health Related";
  if (/psych|mental|counsel|therap|mind relaxation/.test(value)) return "Mind Relaxation";
  if (/physical|fitness|trainer|exercise|movement|yoga/.test(value)) return "Physical Wellness";
  return "";
}

function ExpertVideoLibrary({ data, expertId, specialization, onUpdate, onCreateVideo, onDeleteVideo, canCreate = true, canDelete = true }) {
  const [query, setQuery] = useState("");
  const [slides, setSlides] = useState({});
  const [cardsPerView, setCardsPerView] = useState(getCardsPerView);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [formError, setFormError] = useState("");
  const [libraryError, setLibraryError] = useState("");
  const [saving, setSaving] = useState(false);
  const [thumbnailGenerating, setThumbnailGenerating] = useState(false);
  const [deletingVideoId, setDeletingVideoId] = useState("");
  const [selectedVideo, setSelectedVideo] = useState(null);
  const metadataUrlRef = useRef("");
  const metadataProbeRef = useRef(null);
  const selectedVideoFileRef = useRef(null);
  const assignedCategory = categoryForSpecialization(specialization || data.expert?.specialization || data.expert?.track);
  const filteredVideos = useMemo(() => data.videos.filter((video) => {
    const search = query.trim().toLowerCase();
    return !search || [video.title, video.category, video.description].some((value) => String(value || "").toLowerCase().includes(search));
  }), [data.videos, query]);

  useEffect(() => () => {
    if (metadataProbeRef.current) {
      metadataProbeRef.current.onloadedmetadata = null;
      metadataProbeRef.current.onseeked = null;
      metadataProbeRef.current.onerror = null;
    }
    if (metadataUrlRef.current) URL.revokeObjectURL(metadataUrlRef.current);
  }, []);

  useEffect(() => {
    const updateCardsPerView = () => setCardsPerView(getCardsPerView());
    window.addEventListener("resize", updateCardsPerView);
    return () => window.removeEventListener("resize", updateCardsPerView);
  }, []);

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function updateDurationPart(part, value) {
    setForm((current) => {
      const [minutes = "", seconds = ""] = current.duration.split(":");
      const nextMinutes = part === "minutes"
        ? value === "" ? "" : value.padStart(2, "0")
        : minutes;
      const nextSeconds = part === "seconds" ? value : seconds;
      return { ...current, duration: nextMinutes || nextSeconds ? `${nextMinutes}:${nextSeconds}` : "" };
    });
  }

  function selectVideoFile(file) {
    selectedVideoFileRef.current = file;
    if (metadataProbeRef.current) {
      metadataProbeRef.current.onloadedmetadata = null;
      metadataProbeRef.current.onseeked = null;
      metadataProbeRef.current.onerror = null;
      metadataProbeRef.current = null;
    }
    if (metadataUrlRef.current) URL.revokeObjectURL(metadataUrlRef.current);
    metadataUrlRef.current = "";
    setThumbnailGenerating(false);
    setForm((current) => ({ ...current, videoFile: file, duration: "", generatedThumbnailFile: null }));
    setFormError("");
    if (!file) return;

    if (file.size > 250 * 1024 * 1024) {
      setFormError("The MP4 video must be 250 MB or smaller.");
      return;
    }

    setThumbnailGenerating(true);
    const objectUrl = URL.createObjectURL(file);
    metadataUrlRef.current = objectUrl;
    const probe = document.createElement("video");
    metadataProbeRef.current = probe;
    probe.preload = "metadata";

    let releaseTimeout;
    const releaseObjectUrl = () => {
      if (releaseTimeout) window.clearTimeout(releaseTimeout);
      probe.onloadedmetadata = null;
      probe.onerror = null;
      probe.onseeked = null;
      if (metadataProbeRef.current === probe) metadataProbeRef.current = null;
      if (metadataUrlRef.current === objectUrl) {
        URL.revokeObjectURL(objectUrl);
        metadataUrlRef.current = "";
      }
    };

    probe.onloadedmetadata = () => {
      const durationInSeconds = probe.duration;
      if (selectedVideoFileRef.current !== file) {
        releaseObjectUrl();
        return;
      }
      if (!Number.isFinite(durationInSeconds) || durationInSeconds <= 0) {
        setThumbnailGenerating(false);
        releaseObjectUrl();
        setFormError("Could not read the duration from this video. Please choose a valid MP4 file.");
        return;
      }

      const roundedDuration = Math.round(durationInSeconds);
      const duration = `${String(Math.floor(roundedDuration / 60)).padStart(2, "0")}:${String(roundedDuration % 60).padStart(2, "0")}`;
      setForm((current) => current.videoFile === file ? { ...current, duration } : current);

      probe.onseeked = () => {
        try {
          if (!probe.videoWidth || !probe.videoHeight) {
            setThumbnailGenerating(false);
            releaseObjectUrl();
            return;
          }
          const canvas = document.createElement("canvas");
          canvas.width = probe.videoWidth;
          canvas.height = probe.videoHeight;
          const context = canvas.getContext("2d");
          if (!context) {
            setThumbnailGenerating(false);
            releaseObjectUrl();
            return;
          }
          context.drawImage(probe, 0, 0, canvas.width, canvas.height);
          canvas.toBlob((blob) => {
            setThumbnailGenerating(false);
            if (blob && selectedVideoFileRef.current === file) {
              const baseName = file.name.replace(/\.[^.]+$/, "") || "video";
              const generatedThumbnailFile = new File([blob], `${baseName}-thumbnail.jpg`, { type: "image/jpeg" });
              setForm((current) => current.videoFile === file && !current.thumbnailFile
                ? { ...current, generatedThumbnailFile }
                : current);
            }
            releaseObjectUrl();
          }, "image/jpeg", 0.82);
        } catch {
          setThumbnailGenerating(false);
          releaseObjectUrl();
        }
      };

      try {
        probe.currentTime = Math.min(1, durationInSeconds / 2);
      } catch {
        setThumbnailGenerating(false);
        releaseObjectUrl();
      }
    };

    probe.onerror = () => {
      if (selectedVideoFileRef.current !== file) {
        releaseObjectUrl();
        return;
      }
      setThumbnailGenerating(false);
      releaseObjectUrl();
      if (selectedVideoFileRef.current === file) {
        setFormError("Could not read the duration from this video. Please choose a valid MP4 file.");
      }
    };

    probe.src = objectUrl;
    releaseTimeout = window.setTimeout(() => {
      setThumbnailGenerating(false);
      releaseObjectUrl();
    }, 15000);
  }

  function moveCategory(category, direction, count) {
    setSlides((current) => ({ ...current, [category]: Math.max(0, Math.min((current[category] || 0) + direction, Math.max(0, Math.ceil(count / cardsPerView) - 1))) }));
  }

  async function submitVideo(event) {
    event.preventDefault();
    if (!canCreate) return;
    if (!assignedCategory) {
      setFormError("We couldn't match your profile specialization to a video category. Please update your wellness expert profile first.");
      return;
    }
    if (!form.title.trim() || !form.description.trim()) {
      setFormError("Please complete the title and description before saving.");
      return;
    }
    if ((form.videoSource === "link" && !form.videoLink.trim()) || (form.videoSource === "upload" && !form.videoFile)) {
      setFormError(form.videoSource === "upload" ? "Choose an MP4 video file to upload." : "Enter a video link.");
      return;
    }
    if (form.videoFile && form.videoFile.size > 250 * 1024 * 1024) {
      setFormError("The MP4 video must be 250 MB or smaller.");
      return;
    }
    if (form.thumbnailFile && form.thumbnailFile.size > 10 * 1024 * 1024) {
      setFormError("The thumbnail image must be 10 MB or smaller.");
      return;
    }
    const hasCustomThumbnail = form.thumbnailSource === "upload"
      ? Boolean(form.thumbnailFile)
      : Boolean(form.thumbnailLink.trim());
    if (form.videoSource === "upload" && !hasCustomThumbnail && thumbnailGenerating) {
      setFormError("Please wait for the video thumbnail frame to finish generating, or select an image file.");
      return;
    }

    const [minutesPart = "", secondsPart = ""] = form.duration.split(":");
    const minutes = Number(minutesPart);
    const seconds = Number(secondsPart);
    if (!/^\d+$/.test(minutesPart) || !/^\d{2}$/.test(secondsPart) || !Number.isSafeInteger(minutes) || minutes < 0 || seconds < 0 || seconds > 59 || (minutes === 0 && seconds === 0)) {
      setFormError(form.videoSource === "upload"
        ? "Wait for the uploaded video's duration to be detected, or choose a valid MP4 file."
        : "Enter a valid duration with whole minutes and 0–59 seconds.");
      return;
    }
    const video = { ...form, category: assignedCategory };
    setSaving(true);
    try {
      if (onCreateVideo) await onCreateVideo(video);
      else onUpdate({ videos: [...data.videos, { ...video, id: makeId("video") }] });
      setForm(initialForm);
      setThumbnailGenerating(false);
      setFormError("");
      setModalOpen(false);
    } catch (requestError) {
      setFormError(requestError.message || "The video could not be saved.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteVideo(video) {
    if (!canDelete || !expertId || String(video.creatorExpertId || "") !== String(expertId)) return;
    const confirmed = window.confirm("Are you sure that you want to delete this video?");
    if (!confirmed) return;
    setDeletingVideoId(video.id);
    setLibraryError("");
    try {
      await onDeleteVideo(video.id);
    } catch (deleteError) {
      setLibraryError(deleteError.message || "The video could not be deleted.");
    } finally {
      setDeletingVideoId("");
    }
  }

  return <>
    <section className="library-hero"><div><p className="eyebrow">Expert Video Library</p><h1>Video Library</h1><p className="subtitle">Explore our collection of wellness videos curated for your health journey.</p></div>{canCreate && <button className="add-video-btn" type="button" onClick={() => setModalOpen(true)}><i className="fa-solid fa-plus" /> Add Video</button>}</section>
    <section className="filter-panel"><label className="search-box"><i className="fa-solid fa-magnifying-glass search-icon" /><input value={query} onChange={(event) => setQuery(event.target.value)} type="text" placeholder="Search for videos..." /></label></section>
    {libraryError && !modalOpen && <p className="expert-video-action-error" role="alert">{libraryError}</p>}
    {categories.map(([category, sectionKey, title, description, iconColor, icon]) => {
      const videos = filteredVideos.filter((video) => video.category === category);
      const page = Math.min(slides[category] || 0, Math.max(0, Math.ceil(videos.length / cardsPerView) - 1));
      const visible = videos.slice(page * cardsPerView, page * cardsPerView + cardsPerView);
      return (
        <section className="video-category" data-category-section={sectionKey} key={category} hidden={!videos.length}>
          <div className="section-header">
            <div className="section-title">
              <span className={`section-icon ${iconColor}`}><i className={`fa-solid ${icon}`} /></span>
              <div><h2>{title}</h2><p>{description}</p></div>
            </div>
            <div className="section-controls">
              <button className="circle-btn" type="button" disabled={page === 0} onClick={() => moveCategory(category, -1, videos.length)} aria-label="Previous videos">&lsaquo;</button>
              <button className="circle-btn active" type="button" disabled={(page + 1) * cardsPerView >= videos.length} onClick={() => moveCategory(category, 1, videos.length)} aria-label="Next videos">&rsaquo;</button>
            </div>
          </div>
          <div className="video-viewport">
            <div className="video-grid">
              {visible.map((video) => (
                <article className="video-card" data-title={video.title} key={video.id}>
                  <VideoCardMedia video={video} onPlay={setSelectedVideo} />
                  <div className="card-body">
                    <h3>{video.title}</h3>
                    <span className="video-uploader-tag">Uploaded by {video.creatorExpertName || "Wellness Expert"}</span>
                    {canDelete && expertId && String(video.creatorExpertId || "") === String(expertId) && <button
                      className="expert-video-delete-button"
                      type="button"
                      disabled={deletingVideoId === video.id}
                      aria-label={`Delete ${video.title}`}
                      onClick={() => deleteVideo(video)}
                    >
                      <i className="fa-regular fa-trash-can" aria-hidden="true" />
                      {deletingVideoId === video.id ? "Deleting…" : "Delete"}
                    </button>}
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      );
    })}
    {!filteredVideos.length && <div className="empty-state">No videos match your search.</div>}
    <VideoPlayerModal video={selectedVideo} onClose={() => setSelectedVideo(null)} />

    {modalOpen && (
      <div className="video-modal-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget && !saving) setModalOpen(false); }}>
        <div className="video-modal" role="dialog" aria-modal="true" aria-labelledby="videoModalTitle">
          <div className="video-modal-header">
            <div>
              <p className="video-modal-eyebrow">VIDEO LIBRARY</p>
              <h2 id="videoModalTitle">Add New Video</h2>
              <p className="video-modal-copy">Add the details for a new wellness video without leaving this page.</p>
            </div>
            <button className="video-close-btn" type="button" onClick={() => setModalOpen(false)} disabled={saving}>Close</button>
          </div>
          <form className="video-modal-form" onSubmit={submitVideo} noValidate>
            {formError && <p className="video-form-error" role="alert">{formError}</p>}
            <div className="video-form-grid">
              <label className="video-field video-field-wide"><span>Video Title</span><input value={form.title} onChange={(event) => updateField("title", event.target.value)} type="text" placeholder="Enter video title" /></label>
              <label className="video-field"><span>Video source</span><select value={form.videoSource} onChange={(event) => { const videoSource = event.target.value; setForm((current) => ({ ...current, videoSource, duration: videoSource === "upload" && !current.videoFile ? "" : current.duration })); setFormError(""); }}><option value="link">Video link</option><option value="upload">Upload MP4 file</option></select></label>
              {form.videoSource === "link"
                ? <label className="video-field video-field-wide"><span>Video Link</span><input value={form.videoLink} onChange={(event) => updateField("videoLink", event.target.value)} type="url" placeholder="Paste YouTube or video URL" /></label>
                : <label className="video-field video-field-wide"><span>MP4 Video File</span><input type="file" accept="video/mp4,.mp4" onChange={(event) => selectVideoFile(event.target.files?.[0] || null)} /><small className="video-field-note">MP4 only · up to 250 MB{form.videoFile ? ` · ${form.videoFile.name}` : ""}</small></label>}
              <label className="video-field"><span>Thumbnail source</span><select value={form.thumbnailSource} onChange={(event) => updateField("thumbnailSource", event.target.value)}><option value="link">Image link (optional)</option><option value="upload">Upload image file</option></select></label>
              {form.thumbnailSource === "link"
                ? <label className="video-field video-field-wide"><span>Thumbnail Link (optional)</span><input value={form.thumbnailLink} onChange={(event) => updateField("thumbnailLink", event.target.value)} type="url" placeholder="Paste an image URL" /></label>
                : <label className="video-field video-field-wide"><span>Thumbnail Image (optional)</span><input type="file" accept="image/png,.png,image/jpeg,.jpg,.jpeg,image/webp,.webp" onChange={(event) => updateField("thumbnailFile", event.target.files?.[0] || null)} /><small className="video-field-note">PNG, JPEG, or WebP · up to 10 MB{form.thumbnailFile ? ` · ${form.thumbnailFile.name}` : ` · ${thumbnailGenerating ? "generating a frame from the video…" : "a frame from the video is used if no image is selected"}`}</small></label>}
              <label className="video-field">
                <span>Duration (minutes:seconds)</span>
                <div className="video-duration-picker">
                  <input
                    type={form.videoSource === "upload" ? "text" : "number"}
                    min="0"
                    step="1"
                    inputMode="numeric"
                    aria-label="Duration minutes"
                    placeholder="MM"
                    readOnly={form.videoSource === "upload"}
                    value={form.duration.split(":")[0] || ""}
                    onChange={(event) => updateDurationPart("minutes", event.target.value)}
                  />
                  <span className="video-duration-separator" aria-hidden="true">:</span>
                  <select aria-label="Duration seconds" disabled={form.videoSource === "upload"} value={form.duration.split(":")[1] || ""} onChange={(event) => updateDurationPart("seconds", event.target.value)}>
                    <option value="">SS</option>
                    {secondOptions.map((value) => <option key={`seconds-${value}`} value={value}>{value}</option>)}
                  </select>
                </div>
                {form.videoSource === "upload" && <small className="video-field-note">{form.videoFile ? (form.duration ? "Duration detected from the uploaded video." : "Reading duration from the uploaded video…") : "Upload an MP4 to detect its duration automatically."}</small>}
              </label>
              <label className="video-field video-field-wide"><span>Description</span><textarea value={form.description} onChange={(event) => updateField("description", event.target.value)} rows="4" placeholder="Write a short summary for this video." /></label>
            </div>
            <div className="video-modal-actions">
              <button className="video-secondary-btn" type="button" onClick={() => setModalOpen(false)} disabled={saving}>Cancel</button>
              <button className="video-primary-btn" type="submit" disabled={saving}>{saving ? "Saving…" : "Save Video"}</button>
            </div>
          </form>
        </div>
      </div>
    )}
  </>;
}

export default ExpertVideoLibrary;
