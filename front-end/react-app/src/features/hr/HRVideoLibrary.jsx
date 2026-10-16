import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import RouteLoadingScreen from "../../components/RouteLoadingScreen.jsx";
import usePageStylesheets from "../../hooks/usePageStylesheets.js";
import HRNavbar from "./components/HRNavbar.jsx";
import hrApi from "./hrApi.js";
import { getCurrentHrCompanyContext } from "./hrUtils.js";
import VideoCardMedia from "../shared/VideoCardMedia.jsx";
import VideoPlayerModal from "../shared/VideoPlayerModal.jsx";
import useAutoRefresh from "../../hooks/useAutoRefresh.js";

const categories = [
  {
    key: "health",
    label: "Health Related",
    title: "Health Related Videos",
    description:
      "Nutrition, recovery, sleep, and practical daily health guidance.",
    icon: "fa-heart-pulse",
    tone: "pink",
  },
  {
    key: "mind",
    label: "Mind Relaxation",
    title: "Mind Relaxation Videos",
    description:
      "Mindfulness, stress relief, calming routines, and guided resets.",
    icon: "fa-brain",
    tone: "purple",
  },
  {
    key: "physical",
    label: "Physical Wellness",
    title: "Physical Wellness Videos",
    description:
      "Movement, flexibility, desk mobility, and energizing body routines.",
    icon: "fa-dumbbell",
    tone: "green",
  },
];

function HRVideoLibrary() {
  const stylesReady = usePageStylesheets("/hr-video-library-legacy.css");
  const [videos, setVideos] = useState([]);
  const [search, setSearch] = useState("");
  const [positions, setPositions] = useState({
    health: 0,
    mind: 0,
    physical: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [cardsPerView, setCardsPerView] = useState(getCardsPerView());
  const [cardSteps, setCardSteps] = useState({});
  const categoryRefs = useRef({});

  const loadVideos = useCallback(async (silent = false) => {
    try {
      const nextVideos = await hrApi.getVideos(getCurrentHrCompanyContext());
      setVideos(nextVideos || []);
      setError("");
    } catch (loadError) {
      if (!silent)
        setError(loadError.message || "Could not load the video library.");
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const onResize = () => setCardsPerView(getCardsPerView());
    window.addEventListener("resize", onResize);
    loadVideos();
    return () => {
      window.removeEventListener("resize", onResize);
    };
  }, [loadVideos]);

  useAutoRefresh(() => loadVideos(true), "hr-videos");

  const filteredVideos = useMemo(() => {
    const query = search.trim().toLowerCase();
    return videos.filter(
      (video) =>
        !query ||
        String(video.title || "")
          .toLowerCase()
          .includes(query),
    );
  }, [videos, search]);

  useEffect(() => {
    const measure = () => {
      const steps = {};
      for (const category of categories) {
        const section = categoryRefs.current[category.key];
        const viewport = section?.querySelector(".video-viewport");
        const grid = viewport?.querySelector(".video-grid");
        const card = grid?.querySelector(".video-card");
        if (!card || !grid) continue;
        const gap = Number.parseFloat(getComputedStyle(grid).columnGap) || 0;
        steps[category.key] = card.getBoundingClientRect().width + gap;
      }

      setCardSteps((current) => {
        const changed = Object.entries(steps).some(
          ([key, step]) => Math.abs((current[key] || 0) - step) > 0.5,
        );
        return changed ? { ...current, ...steps } : current;
      });
    };

    measure();
    const observer =
      typeof ResizeObserver === "function" ? new ResizeObserver(measure) : null;
    Object.values(categoryRefs.current).forEach((section) => {
      const viewport = section?.querySelector(".video-viewport");
      if (viewport) observer?.observe(viewport);
    });
    window.addEventListener("resize", measure);
    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [filteredVideos, cardsPerView]);

  const hasVideos = categories.some(
    (category) => getCategoryVideos(filteredVideos, category.label).length,
  );

  if (!stylesReady) return <RouteLoadingScreen />;

  return (
    <div className="shell">
      <HRNavbar activeSection="videos" />
      <main className="library-page">
        <section className="library-hero">
          <div>
            <p className="eyebrow">HR Video Library</p>
            <h1>Video Library</h1>
            <p className="subtitle">
              Review curated wellness content, spotlight key learning tracks,
              and organize videos employees can use across health, mind, and
              fitness programs.
            </p>
          </div>
        </section>

        <section className="filter-panel">
          <label className="search-box">
            <i
              className="fa-solid fa-magnifying-glass search-icon"
              aria-hidden="true"
            />
            <input
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search for videos..."
              type="text"
              value={search}
            />
          </label>
        </section>

        {loading && <p className="empty-state">Loading company videos…</p>}
        {error && <p className="empty-state">{error}</p>}
        {!loading && !error && !hasVideos && (
          <p className="empty-state">
            No company videos are available yet. Ask a wellness expert from your
            company to add one.
          </p>
        )}

        {categories.map((category) => {
          const categoryVideos = getCategoryVideos(
            filteredVideos,
            category.label,
          );
          if (!categoryVideos.length) return null;
          const maxIndex = Math.max(categoryVideos.length - cardsPerView, 0);
          const position = Math.min(positions[category.key] || 0, maxIndex);
          return (
            <section
              className="video-category"
              data-category-section={category.key}
              key={category.key}
              ref={(element) => {
                categoryRefs.current[category.key] = element;
              }}
            >
              <div className="section-header">
                <div className="section-title">
                  <span className={`section-icon ${category.tone}`}>
                    <i className={`fa-solid ${category.icon}`} />
                  </span>
                  <div>
                    <h2>{category.title}</h2>
                    <p>{category.description}</p>
                  </div>
                </div>
                <div className="section-controls">
                  <button
                    className="circle-btn"
                    disabled={position === 0}
                    onClick={() => move(category.key, -1, maxIndex)}
                    type="button"
                    aria-label="Previous videos"
                  >
                    &lsaquo;
                  </button>
                  <button
                    className="circle-btn active"
                    disabled={position >= maxIndex}
                    onClick={() => move(category.key, 1, maxIndex)}
                    type="button"
                    aria-label="Next videos"
                  >
                    &rsaquo;
                  </button>
                </div>
              </div>
              <div className="video-viewport">
                <div
                  className="video-grid"
                  style={{
                    transform: `translateX(-${position * (cardSteps[category.key] || 0)}px)`,
                  }}
                >
                  {categoryVideos.map((video) => (
                    <VideoCard
                      key={video.id || `${category.key}-${video.title}`}
                      video={video}
                      onPlayVideo={setSelectedVideo}
                    />
                  ))}
                </div>
              </div>
            </section>
          );
        })}
      </main>
      <VideoPlayerModal
        video={selectedVideo}
        onClose={() => setSelectedVideo(null)}
      />
    </div>
  );

  function move(category, direction, maxIndex) {
    setPositions((current) => ({
      ...current,
      [category]: Math.max(
        0,
        Math.min((current[category] || 0) + direction, maxIndex),
      ),
    }));
  }
}

function VideoCard({ video, onPlayVideo }) {
  const title = video.title || "Wellness video";
  return (
    <article className="video-card">
      <VideoCardMedia video={video} onPlay={onPlayVideo} />
      <div className="card-body">
        <h3>{title}</h3>
        <span className="video-uploader-tag">
          Uploaded by {video.creatorExpertName || "Wellness Expert"}
        </span>
      </div>
    </article>
  );
}

function getCategoryVideos(videos, category) {
  return videos.filter(
    (video) =>
      String(video.category || "")
        .trim()
        .toLowerCase() === category.toLowerCase(),
  );
}

function getCardsPerView() {
  if (typeof window === "undefined" || window.innerWidth <= 700) return 1;
  if (window.innerWidth <= 1100) return 2;
  return 3;
}

export default HRVideoLibrary;
