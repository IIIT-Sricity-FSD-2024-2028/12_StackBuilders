import { useMemo, useState } from "react";
import HRNavbar from "./components/HRNavbar.jsx";
import "./hr-video-library.css";

const VIDEO_STORAGE_KEY = "stackbuilders.videoLibrary.v1";
const defaultThumbnail =
  "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=900&q=80";

const categories = [
  {
    id: "health",
    label: "Health Related",
    title: "Health Related Videos",
    description: "Nutrition, recovery, sleep, and practical daily health guidance.",
    icon: "♥",
    tone: "pink",
  },
  {
    id: "mind",
    label: "Mind Relaxation",
    title: "Mind Relaxation Videos",
    description: "Mindfulness, stress relief, calming routines, and guided resets.",
    icon: "◆",
    tone: "purple",
  },
  {
    id: "physical",
    label: "Physical Wellness",
    title: "Physical Wellness Videos",
    description: "Movement, flexibility, desk mobility, and energizing body routines.",
    icon: "↗",
    tone: "green",
  },
];

const categoryLookup = {
  "Health Related": "health",
  "Mind Relaxation": "mind",
  "Physical Wellness": "physical",
};

function HRVideoLibrary() {
  const [searchTerm, setSearchTerm] = useState("");
  const [pageByCategory, setPageByCategory] = useState({});
  const videos = useMemo(readVideos, []);
  const normalizedSearch = searchTerm.trim().toLowerCase();
  const groupedVideos = useMemo(() => {
    return categories.reduce((groups, category) => {
      groups[category.id] = videos.filter((video) => {
        const belongsToCategory = categoryLookup[video.category] === category.id;
        const matchesSearch =
          !normalizedSearch ||
          [video.title, video.description, video.creatorExpertName]
            .filter(Boolean)
            .some((value) => String(value).toLowerCase().includes(normalizedSearch));

        return belongsToCategory && matchesSearch;
      });
      return groups;
    }, {});
  }, [normalizedSearch, videos]);

  const totalVisibleVideos = categories.reduce(
    (total, category) => total + groupedVideos[category.id].length,
    0
  );

  function changePage(categoryId, direction) {
    const maxPage = Math.max(0, groupedVideos[categoryId].length - 3);
    setPageByCategory((current) => {
      const nextPage = Math.min(Math.max((current[categoryId] || 0) + direction, 0), maxPage);
      return { ...current, [categoryId]: nextPage };
    });
  }

  return (
    <div className="hr-video-page">
      <HRNavbar activeSection="videos" />

      <main className="hr-video-main">
        <section className="hr-video-hero">
          <p className="hr-video-eyebrow">HR Video Library</p>
          <h1>Video Library</h1>
          <p>
            Review curated wellness content, spotlight key learning tracks, and organize
            videos employees can use across health, mind, and fitness programs.
          </p>
        </section>

        <section className="hr-video-filter">
          <label>
            <span aria-hidden="true">⌕</span>
            <input
              type="search"
              placeholder="Search for videos..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </label>
        </section>

        {!totalVisibleVideos && (
          <div className="hr-video-empty">
            {videos.length
              ? "No videos match your search right now."
              : "No company videos are available yet. Ask a wellness expert from your company to add one."}
          </div>
        )}

        {categories.map((category) => {
          const categoryVideos = groupedVideos[category.id];
          if (!categoryVideos.length) return null;

          const page = Math.min(pageByCategory[category.id] || 0, Math.max(0, categoryVideos.length - 3));
          const visibleVideos = categoryVideos.slice(page, page + 3);
          const canGoPrevious = page > 0;
          const canGoNext = page + 3 < categoryVideos.length;

          return (
            <section className="hr-video-category" key={category.id}>
              <div className="hr-video-section-header">
                <div className="hr-video-section-title">
                  <span className={`hr-video-section-icon ${category.tone}`}>{category.icon}</span>
                  <div>
                    <h2>{category.title}</h2>
                    <p>{category.description}</p>
                  </div>
                </div>
                <div className="hr-video-section-controls">
                  <button
                    type="button"
                    disabled={!canGoPrevious}
                    onClick={() => changePage(category.id, -1)}
                    aria-label={`Previous ${category.title}`}
                  >
                    ‹
                  </button>
                  <button
                    type="button"
                    className="active"
                    disabled={!canGoNext}
                    onClick={() => changePage(category.id, 1)}
                    aria-label={`Next ${category.title}`}
                  >
                    ›
                  </button>
                </div>
              </div>

              <div className="hr-video-grid">
                {visibleVideos.map((video) => (
                  <VideoCard video={video} key={video.id} />
                ))}
              </div>
            </section>
          );
        })}
      </main>
    </div>
  );
}

function VideoCard({ video }) {
  return (
    <article className="hr-video-card">
      <a href={video.videoLink || "#"} target="_blank" rel="noreferrer">
        <span className="hr-video-thumb">
          <img src={video.thumbnailLink || defaultThumbnail} alt={video.title} />
          <span>{video.duration || "00:00"}</span>
        </span>
        <span className="hr-video-card-body">
          <strong>{video.title || "Untitled video"}</strong>
          <small>Uploaded by {video.creatorExpertName || "Wellness Expert"}</small>
        </span>
      </a>
    </article>
  );
}

function readVideos() {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(VIDEO_STORAGE_KEY) || "[]");
    return Array.isArray(parsed) ? parsed.map(normalizeVideo).filter(Boolean) : [];
  } catch {
    return [];
  }
}

function normalizeVideo(video) {
  if (!video || typeof video !== "object") return null;

  return {
    id: String(video.id || `${video.title}-${video.videoLink}`),
    title: String(video.title || "").trim(),
    category: String(video.category || "").trim(),
    duration: String(video.duration || "00:00").trim(),
    videoLink: String(video.videoLink || "#").trim(),
    thumbnailLink: String(video.thumbnailLink || defaultThumbnail).trim(),
    description: String(video.description || "").trim(),
    creatorExpertName: String(video.creatorExpertName || "Wellness Expert").trim(),
  };
}

export default HRVideoLibrary;
