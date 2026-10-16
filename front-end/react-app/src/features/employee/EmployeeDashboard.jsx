import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentEmployee, getCompanyContext, updateCurrentEmployee } from './services/employeeAuth';
import { getDailyTip } from './services/storageServices';
import employeeApi from './services/employeeApi';
import VideoThumbnail from '../shared/VideoThumbnail.jsx';
import VideoPlayerModal from '../shared/VideoPlayerModal.jsx';
import useAutoRefresh from '../../hooks/useAutoRefresh.js';
import { useRoleAccess } from '../shared/roleAccessContext.jsx';

const REWARDS_PER_PAGE = 3;

export default function EmployeeDashboard() {
  const { hasPermission } = useRoleAccess();
  const canReadReports = hasPermission('reports-read');
  const canReadConsultations = hasPermission('user-management-read');
  const canReadClientFeatures = hasPermission('client-management-read');
  const canReadChallenges = hasPermission('challenge-management-read');
  const canUpdateChallenges = hasPermission('challenge-management-update');
  const navigate = useNavigate();
  const [employee, setEmployee] = useState(getCurrentEmployee);
  const companyCtx = getCompanyContext(employee);

  const [challenges, setChallenges] = useState([]);
  const [selectedChallengeId, setSelectedChallengeId] = useState(null);
  const [rewards, setRewards] = useState([]);
  const [rewardPage, setRewardPage] = useState(0);
  const [liveSessions, setLiveSessions] = useState([]);
  const [videos, setVideos] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [experts, setExperts] = useState([]);
  const [claimingRewardId, setClaimingRewardId] = useState(null);
  const [rewardMessage, setRewardMessage] = useState('');
  const [loadError, setLoadError] = useState('');
  const dailyTip = getDailyTip();

  const loadDashboard = useCallback(async () => {
    if (!employee) return;
    setLoadError('');
    try {
      const [ch, rewardList, sessionList, videoList, expertList] = await Promise.all([
        employeeApi.getChallenges(companyCtx),
        employeeApi.getRewards(companyCtx),
        employeeApi.getLiveSessions(companyCtx),
        employeeApi.getVideos(companyCtx),
        employeeApi.getExperts(companyCtx).catch(() => []),
      ]);
      setChallenges(ch || []);
      setSelectedChallengeId((current) => ch?.some((challenge) => challenge.id === current) ? current : ch?.[0]?.id || null);
      setRewards(rewardList || []);
      setLiveSessions(sessionList || []);
      setVideos((videoList || []).slice(0, 3));
      setExperts(Array.isArray(expertList) ? expertList : []);
    } catch (error) {
      setLoadError(error.message || 'Could not load the employee dashboard.');
    }
  }, [employee?.id, companyCtx.companyId, companyCtx.companyName]);

  useEffect(() => { loadDashboard(); }, [loadDashboard]);
  useAutoRefresh(loadDashboard, `${employee?.id || ''}:${companyCtx.companyId || companyCtx.companyName || ''}`);

  const selectedChallenge = challenges.find(c => c.id === selectedChallengeId) || challenges[0] || null;
  const pagedRewards = rewards.slice(rewardPage * REWARDS_PER_PAGE, (rewardPage + 1) * REWARDS_PER_PAGE);
  const totalRewardPages = Math.ceil(rewards.length / REWARDS_PER_PAGE);
  const rewardBalance = Number(employee?.rewardPointsBalance) || 0;
  const upcomingSession = liveSessions.find(s => s.status === 'scheduled') || liveSessions[0] || null;
  const snapshotAreas = [!!liveSessions.length, !!challenges.length, !!rewards.length].filter(Boolean).length;
  const snapshotProgress = Math.min((snapshotAreas / 3) * 100, 100);
  const expertCount = (matcher) => experts.filter((expert) => matcher(String(expert.specialization || '').toLowerCase())).length;

  async function claimReward(reward) {
    if (!canUpdateChallenges || !employee?.id || claimingRewardId) return;
    setRewardMessage('');
    setClaimingRewardId(reward.id);
    try {
      const result = await employeeApi.claimReward(reward.id, employee.id);
      if (result?.employee) {
        updateCurrentEmployee(result.employee);
        setEmployee(result.employee);
      }
      if (result?.reward) {
        setRewards((current) => current.map((item) => item.id === result.reward.id ? result.reward : item));
      }
      setRewardMessage('Reward claimed successfully.');
    } catch (error) {
      setRewardMessage(error.message || 'The reward could not be claimed right now.');
    } finally {
      setClaimingRewardId(null);
    }
  }

  return (
    <>
      <div className="container">
        {loadError && <p className="employee-api-error" role="alert">{loadError}</p>}

        {/* ── Top Section ──────────────────────────────────────────────────── */}
      <section className="top-section">

        {/* Workspace Snapshot */}
        {canReadReports && <div className="card main-card">
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
        </div>}

        {/* Active Challenges */}
        {canReadChallenges && <div className="card main-card">
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
        </div>}

        {/* Leaderboard */}
        {canReadChallenges && <div className="card main-card">
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
        </div>}
      </section>

      {/* ── Rewards ──────────────────────────────────────────────────────── */}
      {canReadChallenges && <section className="reward-section card">
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
          {rewardMessage && <p role="status" className="employee-reward-message">{rewardMessage}</p>}

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
                          {employee?.claimedRewardIds?.includes(reward.id) ? 'Claimed' : Number(reward.claimedCount) >= Number(reward.claimableCount) ? 'Unavailable' : canAfford ? 'Available' : 'Locked'}
                        </span>
                      </div>
                      <p>{reward.description || 'Redeem this reward with your points.'}</p>
                      <div className="reward-bottom">
                        <span>{reward.points} points</span>
                        <button type="button" disabled={!canUpdateChallenges || !canAfford || Boolean(claimingRewardId) || employee?.claimedRewardIds?.includes(reward.id) || Number(reward.claimedCount) >= Number(reward.claimableCount)} onClick={() => claimReward(reward)}>
                          {!canUpdateChallenges ? 'Unavailable' : claimingRewardId === reward.id ? 'Claiming…' : employee?.claimedRewardIds?.includes(reward.id) ? 'Claimed' : Number(reward.claimedCount) >= Number(reward.claimableCount) ? 'Unavailable' : canAfford ? 'Claim Reward' : 'Locked'}
                        </button>
                      </div>
                    </div>
                  );
                })
            }
          </div>
        </div>
      </section>}

      {/* ── Daily Wellness Tip ───────────────────────────────────────────── */}
      {canReadReports && <section className="card tip-section">
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
      </section>}

      {/* ── Live Section ─────────────────────────────────────────────────── */}
      {canReadClientFeatures && <section className="live-section">
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
      </section>}

      {/* ── Video Library ────────────────────────────────────────────────── */}
      {canReadClientFeatures && <section className="card">
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
            : videos.map((v, i) => {
              const content = <><div className="video-image">
                <VideoThumbnail video={v} alt={v.title || 'Wellness video'} />
                <div className="play-btn"><i className="fa-solid fa-play" /></div>
                {v.category && <span className="video-tag green-tag">{v.category}</span>}
              </div>
              <h4>{v.title || 'Untitled Video'}</h4>
              <p>{v.expertName || v.creatorExpertName || 'Expert'}</p></>;
              return v.videoFileUrl
                ? <button key={v.id || i} className="video-card employee-dashboard-video-button" type="button" onClick={() => setSelectedVideo(v)} aria-label={`Watch ${v.title || 'wellness video'}`}>{content}</button>
                : <a key={v.id || i} className="video-card" href={v.videoLink || undefined} target={v.videoLink ? '_blank' : undefined} rel={v.videoLink ? 'noopener noreferrer' : undefined} aria-label={`Watch ${v.title || 'wellness video'}`}>{content}</a>;
            })
          }
        </div>
      </section>}

      {/* ── Expert Categories ────────────────────────────────────────────── */}
      {canReadConsultations && <section className="card">
        <h2>Expert Categories</h2>
        <div className="expert-grid">
          <div className="expert purple">
            <div className="expert-icon"><i className="fa-solid fa-brain" /></div>
            <h3>Psychologists</h3>
            <p>Mental health experts for mindfulness and stress management</p>
            <span id="employeePsychologistCount">{expertCount((specialization) => specialization.includes('psych'))} Experts Available</span>
          </div>
          <div className="expert green">
            <div className="expert-icon"><i className="fa-regular fa-heart" /></div>
            <h3>Nutritionists</h3>
            <p>Diet and meal planning experts to optimize your health</p>
            <span id="employeeNutritionistCount">{expertCount((specialization) => specialization.includes('nutrition'))} Experts Available</span>
          </div>
          <div className="expert orange">
            <div className="expert-icon"><i className="fa-solid fa-dumbbell" /></div>
            <h3>Physical Wellness</h3>
            <p>Fitness trainers and yoga instructors for active lifestyle</p>
            <span id="employeePhysicalExpertCount">{expertCount((specialization) => specialization.includes('physical') || specialization.includes('trainer'))} Experts Available</span>
          </div>
        </div>
      </section>}

    </div>
    <VideoPlayerModal video={selectedVideo} onClose={() => setSelectedVideo(null)} />
    </>
  );
}
