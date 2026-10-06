import { useState, useEffect, useRef } from 'react';
import { getCurrentEmployee, getCompanyContext } from '../services/employeeAuth';
import { readVideos } from '../services/storageServices';

const CATEGORY_MAP = {
  health: {
    title: 'Health Related Videos',
    subtitle: 'Nutrition, sleep, and healthy daily habits.',
    icon: 'fa-heart-pulse',
    colorClass: 'pink',
    keys: ['Nutritionist'],
  },
  mind: {
    title: 'Mind Relaxation Videos',
    subtitle: 'Calming routines, mindfulness, and stress relief.',
    icon: 'fa-brain',
    colorClass: 'purple',
    keys: ['Psychologist'],
  },
  physical: {
    title: 'Physical Wellness Videos',
    subtitle: 'Movement, mobility, stretching, and fitness routines.',
    icon: 'fa-dumbbell',
    colorClass: 'green',
    keys: ['Physical Wellness'],
  },
};

const CARD_WIDTH = 330; // px — approximate card width + gap

function VideoCategory({ id, config, videos }) {
  const [offset, setOffset] = useState(0);
  const containerRef = useRef(null);

  if (videos.length === 0) return null;

  const maxOffset = Math.max(0, videos.length - 1);

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
          <button className={`circle-btn ${offset > 0 ? 'active' : ''}`} type="button" onClick={() => setOffset((o) => Math.max(0, o - 1))}>‹</button>
          <button className={`circle-btn ${offset < maxOffset ? 'active' : ''}`} type="button" onClick={() => setOffset((o) => Math.min(maxOffset, o + 1))}>›</button>
        </div>
      </div>
      <div className="video-viewport">
        <div
          className="video-grid"
          ref={containerRef}
          style={{ transform: `translateX(-${offset * CARD_WIDTH}px)`, transition: 'transform 0.3s ease' }}
        >
          {videos.map((v, i) => (
            <article key={v.id || i} className="video-card">
              <a className="thumbnail" href={v.videoLink || '#'} target="_blank" rel="noopener noreferrer">
                <img
                  src={v.thumbnailLink || v.thumbnail || 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=900&q=80'}
                  alt={v.title}
                />
                <span className="duration">{v.duration || '00:00'}</span>
              </a>
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

  useEffect(() => {
    if (!employee) return;
    setVideos(readVideos(companyCtx));
  }, []);

  const filtered         = videos.filter((v) => !searchQuery || v.title?.toLowerCase().includes(searchQuery.toLowerCase()));
  const getByCategory    = (keys) => filtered.filter((v) => keys.includes(v.category));

  return (
    <div className="shell">
      <main className="library-page">
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
            <VideoCategory key={id} id={id} config={config} videos={getByCategory(config.keys)} />
          ))
        )}
      </main>
    </div>
  );
}
