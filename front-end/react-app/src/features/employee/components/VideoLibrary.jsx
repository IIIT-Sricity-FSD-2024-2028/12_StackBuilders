import { useState, useEffect, useRef } from 'react';
import { getCurrentEmployee, getCompanyContext } from '../services/employeeAuth';
import employeeApi from '../services/employeeApi';
import VideoCardMedia from '../../shared/VideoCardMedia.jsx';
import VideoPlayerModal from '../../shared/VideoPlayerModal.jsx';
import useAutoRefresh from '../../../hooks/useAutoRefresh.js';

const CATEGORY_MAP = {
  health: {
    title: 'Health Related Videos',
    subtitle: 'Nutrition, sleep, and healthy daily habits.',
    icon: 'fa-heart-pulse',
    colorClass: 'pink',
    keys: ['Health Related', 'Nutrition'],
  },
  mind: {
    title: 'Mind Relaxation Videos',
    subtitle: 'Calming routines, mindfulness, and stress relief.',
    icon: 'fa-brain',
    colorClass: 'purple',
    keys: ['Mind Relaxation', 'Mental Wellness'],
  },
  physical: {
    title: 'Physical Wellness Videos',
    subtitle: 'Movement, mobility, stretching, and fitness routines.',
    icon: 'fa-dumbbell',
    colorClass: 'green',
    keys: ['Physical Wellness', 'Fitness'],
  },
};

const DEFAULT_CARD_STEP = 330;

function VideoCategory({ id, config, videos, onPlayVideo }) {
  const [offset, setOffset] = useState(0);
  const [cardMetrics, setCardMetrics] = useState({ step: DEFAULT_CARD_STEP, visible: 1 });
  const viewportRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    const viewport = viewportRef.current;
    const grid = containerRef.current;
    if (!viewport || !grid) return undefined;

    const measure = () => {
      const card = grid.querySelector('.video-card');
      if (!card) return;
      const gap = Number.parseFloat(getComputedStyle(grid).columnGap) || 0;
      const step = card.getBoundingClientRect().width + gap;
      const visible = Math.max(1, Math.floor((viewport.clientWidth + gap) / step));
      setCardMetrics({ step, visible });
    };

    measure();
    const observer = typeof ResizeObserver === 'function' ? new ResizeObserver(measure) : null;
    observer?.observe(viewport);
    window.addEventListener('resize', measure);
    return () => {
      observer?.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [videos.length]);

  if (videos.length === 0) return null;

  const maxOffset = Math.max(0, videos.length - cardMetrics.visible);
  const visibleOffset = Math.min(offset, maxOffset);

  return (
    <section className="video-category" data-category-section={id}>
      <div className="section-header">
        <div className="section-title">
          <span className={`section-icon ${config.colorClass}`}>
            <i className={`fa-solid ${config.icon}`} />
          </span>
          <div>
            <h2>{config.title}</h2>
            <p>{config.subtitle}</p>
          </div>
        </div>
        <div className="section-controls">
          <button className={`circle-btn ${visibleOffset > 0 ? 'active' : ''}`} type="button" disabled={visibleOffset === 0} onClick={() => setOffset((o) => Math.max(0, Math.min(o, maxOffset) - 1))}>‹</button>
          <button className={`circle-btn ${visibleOffset < maxOffset ? 'active' : ''}`} type="button" disabled={visibleOffset >= maxOffset} onClick={() => setOffset((o) => Math.min(maxOffset, Math.min(o, maxOffset) + 1))}>›</button>
        </div>
      </div>
      <div className="video-viewport" ref={viewportRef}>
        <div
          className="video-grid"
          ref={containerRef}
          style={{ transform: `translateX(-${visibleOffset * cardMetrics.step}px)`, transition: 'transform 0.3s ease' }}
        >
          {videos.map((v, i) => (
            <article key={v.id || i} className="video-card">
              <VideoCardMedia video={v} onPlay={onPlayVideo} />
              <div className="card-body">
                <h3>{v.title}</h3>
                <span className="video-uploader-tag">
                  Uploaded by {v.expertName || v.creatorExpertName || 'Wellness Expert'}
                </span>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function VideoLibrary() {
  const employee   = getCurrentEmployee();
  const companyCtx = getCompanyContext(employee);

  const [videos,      setVideos]      = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loadError,   setLoadError]   = useState('');
  const [selectedVideo, setSelectedVideo] = useState(null);

  const refreshVideos = () => {
    if (!employee) return Promise.resolve();
    return employeeApi.getVideos(companyCtx)
      .then((records) => { setVideos(records || []); setLoadError(''); })
      .catch((error) => setLoadError(error.message || 'Could not load the video library.'));
  };

  useEffect(() => { refreshVideos(); }, [employee?.id, companyCtx.companyId, companyCtx.companyName]);
  useAutoRefresh(refreshVideos, `${employee?.id || ''}:${companyCtx.companyId || companyCtx.companyName || ''}`);

  const filtered         = videos.filter((v) => !searchQuery || v.title?.toLowerCase().includes(searchQuery.toLowerCase()));
  const getByCategory    = (keys) => filtered.filter((v) => keys.includes(v.category));

  return (
    <div className="shell">
      <main className="library-page">
        {loadError && <p className="employee-api-error" role="alert">{loadError}</p>}
        <section className="library-hero">
          <div>
            <p className="eyebrow">Employee Video Library</p>
            <h1>Video Library</h1>
            <p className="subtitle">Explore our collection of wellness videos curated for your health journey.</p>
          </div>
        </section>

        <section className="filter-panel">
          <label className="search-box">
            <i className="fa-solid fa-magnifying-glass search-icon" />
            <input
              type="text"
              placeholder="Search for videos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </label>
        </section>

        {filtered.length === 0 ? (
          <div className="empty-state">
            {searchQuery
              ? 'No videos match your search.'
              : 'No videos are available yet. Ask a wellness expert to add one first.'}
          </div>
        ) : (
            Object.entries(CATEGORY_MAP).map(([id, config]) => (
            <VideoCategory key={id} id={id} config={config} videos={getByCategory(config.keys)} onPlayVideo={setSelectedVideo} />
          ))
        )}
      </main>
      <VideoPlayerModal video={selectedVideo} onClose={() => setSelectedVideo(null)} />
    </div>
  );
}
