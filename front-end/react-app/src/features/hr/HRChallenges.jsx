import { useMemo, useState } from "react";
import HRChallengeCard from "./components/HRChallengeCard.jsx";
import HRChallengeModal from "./components/HRChallengeModal.jsx";
import HRRewardCard from "./components/HRRewardCard.jsx";
import "./hr-challenges.css";

const challengeSeed = [
  { id: "challenge-1", name: "10K Steps Sprint", type: "Fitness", reward: 500, deadline: "30 Sep 2026", goal: "Walk 10,000 steps daily" },
  { id: "challenge-2", name: "Hydration Habit", type: "Health", reward: 350, deadline: "5 Oct 2026", goal: "Drink 3 liters of water" },
  { id: "challenge-3", name: "Mindful Minutes", type: "Wellness", reward: 300, deadline: "12 Oct 2026", goal: "Meditate 10 minutes daily" },
  { id: "challenge-4", name: "Team Stretch Break", type: "Wellness", reward: 250, deadline: "20 Oct 2026", goal: "Complete five guided stretches" },
];

const rewardSeed = [
  { id: "reward-1", name: "Healthy Snack Box", description: "A curated box of nutritious snacks.", points: 800, claimableCount: 50, claimedCount: 12, imageUrl: "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=600&q=80" },
  { id: "reward-2", name: "Wellness Day Pass", description: "Take time to reset and recharge.", points: 1200, claimableCount: 25, claimedCount: 8, imageUrl: "https://images.unsplash.com/photo-1545205597-3d9d02c29597?auto=format&fit=crop&w=600&q=80" },
  { id: "reward-3", name: "Fitness Store Voucher", description: "Choose equipment for your next goal.", points: 1500, claimableCount: 20, claimedCount: 4, imageUrl: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=600&q=80" },
];

function HRChallenges() {
  const [challenges, setChallenges] = useStoredRecords("stackbuilders.react.hr.challenges", challengeSeed);
  const [rewards, setRewards] = useStoredRecords("stackbuilders.react.hr.rewards", rewardSeed);
  const [modal, setModal] = useState(null);
  const [challengePage, setChallengePage] = useState(0);
  const [rewardPage, setRewardPage] = useState(0);
  const pageSize = 3;
  const visibleChallenges = useMemo(() => challenges.slice(challengePage * pageSize, challengePage * pageSize + pageSize), [challenges, challengePage]);
  const visibleRewards = useMemo(() => rewards.slice(rewardPage * pageSize, rewardPage * pageSize + pageSize), [rewards, rewardPage]);

  function createRecord(data) {
    const record = { ...data, id: `${modal}-${Date.now()}` };
    if (modal === "challenge") setChallenges([record, ...challenges]);
    if (modal === "reward") setRewards([{ ...record, claimedCount: 0 }, ...rewards]);
    setChallengePage(0); setRewardPage(0); setModal(null);
  }

  return <div className="hr-challenges-page">
    <section className="hr-challenges-hero"><span className="hr-trophy-mark">★</span><div><h1>Challenges &amp; Rewards</h1><p>Track your progress and earn points</p></div></section>
    <ChallengeBoard title="Active Challenges" subtitle="Complete challenges to earn rewards" actionLabel="Create New Challenge" onCreate={() => setModal("challenge")}>
      <div className="hr-challenges-grid">{visibleChallenges.map((challenge) => <HRChallengeCard challenge={challenge} key={challenge.id} onDelete={(id) => setChallenges(challenges.filter((item) => item.id !== id))} />)}</div>
      <Pager page={challengePage} total={challenges.length} pageSize={pageSize} onChange={setChallengePage} />
    </ChallengeBoard>
    <ChallengeBoard title="Rewards Catalog" subtitle="Highlight the incentives employees can unlock by completing wellness goals." actionLabel="Create New Reward" onCreate={() => setModal("reward")} reward>
      <div className="hr-rewards-grid">{visibleRewards.map((reward) => <HRRewardCard reward={reward} key={reward.id} onDelete={(id) => setRewards(rewards.filter((item) => item.id !== id))} />)}</div>
      <Pager page={rewardPage} total={rewards.length} pageSize={pageSize} onChange={setRewardPage} />
    </ChallengeBoard>
    {modal && <HRChallengeModal kind={modal} onClose={() => setModal(null)} onSubmit={createRecord} />}
  </div>;
}

function ChallengeBoard({ title, subtitle, actionLabel, onCreate, reward, children }) { return <section className={`hr-challenge-board${reward ? " rewards" : ""}`}><div className="hr-challenge-toolbar"><div><h2>{title}</h2><p>{subtitle}</p></div><button className="hr-create-button" onClick={onCreate} type="button"><span>+</span>{actionLabel}</button></div>{children}</section>; }
function Pager({ page, total, pageSize, onChange }) { const max = Math.max(0, Math.ceil(total / pageSize) - 1); return <div className="hr-challenge-pager"><button disabled={page === 0} onClick={() => onChange(page - 1)} type="button">Previous</button><span>Page {page + 1} of {max + 1}</span><button disabled={page >= max} onClick={() => onChange(page + 1)} type="button">Next</button></div>; }
function useStoredRecords(key, fallback) { const [records, setRecords] = useState(() => { try { const stored = window.localStorage.getItem(key); return stored ? JSON.parse(stored) : fallback; } catch { return fallback; } }); function update(next) { setRecords(next); window.localStorage.setItem(key, JSON.stringify(next)); } return [records, update]; }

export default HRChallenges;
