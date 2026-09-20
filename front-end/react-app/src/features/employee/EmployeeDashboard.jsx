import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentEmployee, getCompanyContext } from '../services/employeeAuth';
import {
  readChallenges, readRewards, readLiveSessions, readVideos, getDailyTip,
} from '../services/storageServices';

/* Original CSS files — copied verbatim */
import '../styles/Employee_Dashboard.css';
import '../styles/dashboardNavbar.css';

const REWARDS_PER_PAGE = 3;

export default function EmployeeDashboard() {
  const navigate = useNavigate();
  const employee = getCurrentEmployee();
  const companyCtx = getCompanyContext(employee);

  const [challenges, setChallenges] = useState([]);
  const [selectedChallengeId, setSelectedChallengeId] = useState(null);
  const [rewards, setRewards] = useState([]);
  const [rewardPage, setRewardPage] = useState(0);
  const [liveSessions, setLiveSessions] = useState([]);
  const [videos, setVideos] = useState([]);
  const dailyTip = getDailyTip();

  useEffect(() => {
    if (!employee) return;
    const ch = readChallenges(companyCtx);
    setChallenges(ch);
    if (ch.length) setSelectedChallengeId(ch[0].id);
    setRewards(readRewards(companyCtx));
    setLiveSessions(readLiveSessions(companyCtx));
    setVideos(readVideos(companyCtx).slice(0, 3));
  }, []);

  const selectedChallenge = challenges.find(c => c.id === selectedChallengeId) || challenges[0] || null;
  const pagedRewards = rewards.slice(rewardPage * REWARDS_PER_PAGE, (rewardPage + 1) * REWARDS_PER_PAGE);
  const totalRewardPages = Math.ceil(rewards.length / REWARDS_PER_PAGE);
  const rewardBalance = Number(employee?.rewardPointsBalance) || 0;
  const upcomingSession = liveSessions.find(s => s.status === 'scheduled') || liveSessions[0] || null;
  const snapshotAreas = [!!liveSessions.length, !!challenges.length, !!rewards.length].filter(Boolean).length;
  const snapshotProgress = Math.min((snapshotAreas / 3) * 100, 100);

  return (
    <>
      <div className="container">

        {/* ── Top Section ──────────────────────────────────────────────────── */}
      <section className="top-section">

        {/* Workspace Snapshot */}
        <div className="card main-card">
          <h3><i className="fa-solid fa-wave-square" /> Workspace Snapshot</h3>
          <h1 className="steps" id="employeeSnapshotPrimaryValue">{challenges.length}</h1>
          <p className="small-text" id="employeeSnapshotPrimaryCopy">
            {challenges.length
              ? `${challenges.length} active challenge${challenges.length !== 1 ? 's' : ''} available for your company.`
              : 'No backend activity has been loaded yet.'}
          </p>

          <div className="progress">
            <div className="progress-fill" id="employeeSnapshotProgress" style={{ width: `${snapshotProgress}%` }} />
          </div>

          <div className="rank-box">
            <div className="rank-icon"><i className="fa-solid fa-award" /></div>
            <div>
              <p id="employeeSnapshotSecondaryLabel">Configured Areas</p>
              <h4 id="employeeSnapshotSecondaryValue">{snapshotAreas} of 3 activity areas active</h4>
            </div>
          </div>

          <div className="streak">
            <h4 id="employeeSnapshotTertiaryTitle">Next Upcoming Session</h4>
            <p className="small-text snapshot-copy" id="employeeSnapshotTertiaryCopy">
              {upcomingSession
                ? (upcomingSession.title || upcomingSession.name || 'Live session available')
                : 'No live sessions are scheduled right now.'}
            </p>
            <div className="snapshot-tags" id="employeeSnapshotMetaList">
              {upcomingSession?.category && <span className="snapshot-tag">{upcomingSession.category}</span>}
              {upcomingSession?.expertName && <span className="snapshot-tag">{upcomingSession.expertName}</span>}
            </div>
          </div>
        </div>

        {/* Active Challenges */}
        <div className="card main-card">
          <h3><i className="fa-solid fa-bullseye" /> Active Challenges</h3>
          <div className={`employee-challenge-list${!challenges.length ? ' is-empty' : ''}`} id="employeeChallengeList">
            {!challenges.length
              ? <div className="employee-empty-state">No active challenges yet. Check back after HR creates one.</div>
              : challenges.map(ch => (
                <button
                  key={ch.id}
                  type="button"
                  className={`employee-challenge-item${ch.id === selectedChallengeId ? ' is-active' : ''}`}
                  onClick={() => setSelectedChallengeId(ch.id)}
                >
                  {ch.name}
                </button>
              ))
            }
          </div>
        </div>

        {/* Leaderboard */}
        <div className="card main-card">
          <h3><i className="fa-solid fa-medal" /> {selectedChallenge ? `${selectedChallenge.name} Summary` : 'Leaderboard'}</h3>
          {!selectedChallenge
            ? <div className="leaderboard-empty-state">Leaderboard details will load from the current challenge data.</div>
            : (
              <>
                <div className="leaderboard-empty-state">Leaderboard participation data is not available in the current backend entity set.</div>
                {[
                  { icon: 'fa-bullseye', label: 'Goal', value: selectedChallenge.goal },
                  { icon: 'fa-gift', label: 'Reward', value: selectedChallenge.reward },
                  { icon: 'fa-regular fa-calendar', label: 'Deadline', value: selectedChallenge.deadline },
                ].map(row => (
                  <div key={row.label} className="leader">
                    <div className="num"><i className={`fa-solid ${row.icon}`} /></div>
                    <div><h4>{row.label}</h4><p>{row.value || 'Not specified'}</p></div>
                    <span />
                  </div>
                ))}
              </>
            )
          }
        </div>
      </section>

      {/* ── Rewards ──────────────────────────────────────────────────────── */}
      <section className="reward-section card">
        <div className="balance-card main-card">
          <div className="balance-top">
            <div className="small-icon"><i className="fa-solid fa-award" /></div>
            <div><h5>Your Balance</h5><p>Updated today</p></div>
          </div>
          <h1>{rewardBalance}</h1>
          <h3>Available Rewards</h3>
          <div className="next-box">
            <div className="next-text">
              <span>Reward Catalog</span>
              <span>Loading from backend</span>
            </div>
            <div className="progress small-progress">
              <div className="progress-fill green-fill" style={{ width: '0%' }} />
            </div>
          </div>
        </div>

        <div className="reward-right">
          <div className="reward-header-row">
            <h3><i className="fa-solid fa-gift" /> Available Rewards</h3>
            <div className="reward-nav-controls">
              <button
                type="button"
                className="reward-nav-btn"
                id="prevRewardsBtn"
                disabled={rewardPage === 0}
                onClick={() => setRewardPage(p => p - 1)}
              >Previous</button>
              <button
                type="button"
                className="reward-nav-btn"
                id="nextRewardsBtn"
                disabled={rewardPage >= totalRewardPages - 1 || totalRewardPages === 0}
                onClick={() => setRewardPage(p => p + 1)}
              >Next</button>
            </div>
          </div>

          <div className={`reward-grid${!rewards.length ? ' is-empty' : ''}`} id="rewardGrid">
            {!rewards.length
              ? <div className="reward-empty-state">No rewards available yet. Check back after HR creates one.</div>
              : pagedRewards.map((reward, idx) => {
                  const colors = ['light-green', 'light-blue', 'light-yellow'];
                  const canAfford = rewardBalance >= (reward.points || 0);
                  return (
                    <div key={reward.id || idx} className={`reward-item ${colors[idx % 3]}`}>
                      <div className="reward-meta">
                        <span>{reward.name}</span>
                        <span>{reward.points} pts</span>
                      </div>
                      <div className="reward-status-row">
                        <span className={`reward-status-tag ${canAfford ? 'ready' : 'locked'}`}>
                          {canAfford ? 'Available' : 'Locked'}
                        </span>
                      </div>
                      <p>{reward.description || 'Redeem this reward with your points.'}</p>
                      <div className="reward-bottom">
                        <span>{reward.points} points</span>
                        <button type="button" disabled={!canAfford}>
                          {canAfford ? 'Redeem' : 'Locked'}
                        </button>
                      </div>
                    </div>
                  );
                })
            }
          </div>
        </div>
      </section>

      {/* ── Daily Wellness Tip ───────────────────────────────────────────── */}
      <section className="card tip-section">
        <div className="tip-left">
          <span className="tag">Daily Wellness Tip</span>
          <h2 id="employeeDailyTipTitle">{dailyTip.title}</h2>
          <p id="employeeDailyTipBody">{dailyTip.body}</p>
        </div>
        <div className="tip-right">
          <img
            src="https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=600"
            alt="Meditation"
          />
        </div>
      </section>

      {/* ── Live Section ─────────────────────────────────────────────────── */}
      <section className="live-section">
        <div className="live-content">
          <span className="live-tag">LIVE</span>
          <div className="mini-tags">
            <span>Yoga</span>
            <span>Live Session</span>
          </div>
          <h2 id="employeeLiveSectionTitle">
            {upcomingSession
              ? (upcomingSession.title || upcomingSession.name || 'Live session available')
              : 'No live sessions are scheduled right now'}
          </h2>
          <p id="employeeLiveSectionCopy">
            {upcomingSession
              ? `Hosted by ${upcomingSession.expertName || 'your wellness expert'}.`
              : 'Check back after a wellness expert creates the next session for your company.'}
          </p>
          <button id="liveSessionBtn" onClick={() => navigate('/live-sessions')}>
            View Live Sessions
          </button>
        </div>
      </section>

      {/* ── Video Library ────────────────────────────────────────────────── */}
      <section className="card">
        <div className="title-row">
          <h2>Video Library</h2>
          <button
            className="more-btn"
            type="button"
            onClick={() => navigate('/video-library')}
          >More</button>
        </div>
        <div className="video-grid" id="employeeDashboardVideoGrid">
          {!videos.length
            ? <p className="small-text">No videos available yet.</p>
            : videos.map((v, i) => (
              <div key={v.id || i} className="video-card">
                <div className="video-image">
                  {v.thumbnail
                    ? <img src={v.thumbnail} alt={v.title} />
                    : <div style={{ height: 180, background: '#e5e7eb', borderRadius: 14, display: 'grid', placeItems: 'center' }}>
                        <i className="fa-solid fa-play-circle" style={{ fontSize: 36, color: '#9ca3af' }} />
                      </div>
                  }
                  <div className="play-btn"><i className="fa-solid fa-play" /></div>
                  {v.category && <span className="video-tag green-tag">{v.category}</span>}
                </div>
                <h4>{v.title || 'Untitled Video'}</h4>
                <p>{v.expertName || 'Expert'}</p>
              </div>
            ))
          }
        </div>
      </section>

      {/* ── Expert Categories ────────────────────────────────────────────── */}
      <section className="card">
        <h2>Expert Categories</h2>
        <div className="expert-grid">
          <div className="expert purple">
            <div className="expert-icon"><i className="fa-solid fa-brain" /></div>
            <h3>Psychologists</h3>
            <p>Mental health experts for mindfulness and stress management</p>
            <span id="employeePsychologistCount">Loading expert availability</span>
          </div>
          <div className="expert green">
            <div className="expert-icon"><i className="fa-regular fa-heart" /></div>
            <h3>Nutritionists</h3>
            <p>Diet and meal planning experts to optimize your health</p>
            <span id="employeeNutritionistCount">Loading expert availability</span>
          </div>
          <div className="expert orange">
            <div className="expert-icon"><i className="fa-solid fa-dumbbell" /></div>
            <h3>Physical Wellness</h3>
            <p>Fitness trainers and yoga instructors for active lifestyle</p>
            <span id="employeePhysicalExpertCount">Loading expert availability</span>
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer className="footer">
        <div className="footer-links">
          <a href="#">About us</a>
          <a href="#" className="contact-us-trigger">Contact us</a>
        </div>
        <p>© 2026 Stack Builders. Built with wellness in mind.</p>
      </footer>
    </div>
    </>
  );
}
