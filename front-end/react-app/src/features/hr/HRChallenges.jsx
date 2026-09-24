import { useMemo, useState } from "react";
import HRChallengeCard from "./components/HRChallengeCard.jsx";
import HRChallengeModal from "./components/HRChallengeModal.jsx";
import HRNavbar from "./components/HRNavbar.jsx";
import HRRewardCard from "./components/HRRewardCard.jsx";
import "./hr-challenges.css";

const challengeSeed = [];

const rewardSeed = [];

function HRChallenges() {
  const [challenges, setChallenges] = useStoredRecords("stackbuilders.react.hr.challenges.v2", challengeSeed);
  const [rewards, setRewards] = useStoredRecords("stackbuilders.react.hr.rewards.v2", rewardSeed);
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

  return <div className="hr-challenges-page"><HRNavbar activeSection="challenges" />
    <section className="hr-challenges-hero"><span className="hr-trophy-mark">★</span><div><h1>Challenges &amp; Rewards</h1><p>Track your progress and earn points</p></div></section>
    <ChallengeBoard title="Active Challenges" subtitle="Complete challenges to earn rewards" actionLabel="Create New Challenge" onCreate={() => setModal("challenge")}>
      <div className="hr-challenges-grid">{visibleChallenges.length ? visibleChallenges.map((challenge) => <HRChallengeCard challenge={challenge} key={challenge.id} onDelete={(id) => setChallenges(challenges.filter((item) => item.id !== id))} />) : <EmptyState message="No active challenges yet. Create a challenge to see it here." />}</div>
      <Pager page={challengePage} total={challenges.length} pageSize={pageSize} onChange={setChallengePage} />
    </ChallengeBoard>
    <ChallengeBoard title="Rewards Catalog" subtitle="Highlight the incentives employees can unlock by completing wellness goals." actionLabel="Create New Reward" onCreate={() => setModal("reward")} reward>
      <div className="hr-rewards-grid">{visibleRewards.length ? visibleRewards.map((reward) => <HRRewardCard reward={reward} key={reward.id} onDelete={(id) => setRewards(rewards.filter((item) => item.id !== id))} />) : <EmptyState message="No rewards in the catalog yet. Create a reward to display it here." />}</div>
      <Pager page={rewardPage} total={rewards.length} pageSize={pageSize} onChange={setRewardPage} />
    </ChallengeBoard>
    {modal && <HRChallengeModal kind={modal} onClose={() => setModal(null)} onSubmit={createRecord} />}
  </div>;
}

function ChallengeBoard({ title, subtitle, actionLabel, onCreate, reward, children }) { return <section className={`hr-challenge-board${reward ? " rewards" : ""}`}><div className="hr-challenge-toolbar"><div><h2>{title}</h2><p>{subtitle}</p></div><button className="hr-create-button" onClick={onCreate} type="button"><span>+</span>{actionLabel}</button></div>{children}</section>; }
function EmptyState({ message }) { return <div className="hr-challenge-empty">{message}</div>; }
function Pager({ page, total, pageSize, onChange }) { const max = Math.max(0, Math.ceil(total / pageSize) - 1); return <div className="hr-challenge-pager"><button disabled={page === 0} onClick={() => onChange(page - 1)} type="button">Previous</button><span>Page {page + 1} of {max + 1}</span><button disabled={page >= max} onClick={() => onChange(page + 1)} type="button">Next</button></div>; }
function useStoredRecords(key, fallback) { const [records, setRecords] = useState(() => { try { const stored = window.localStorage.getItem(key); return stored ? JSON.parse(stored) : fallback; } catch { return fallback; } }); function update(next) { setRecords(next); window.localStorage.setItem(key, JSON.stringify(next)); } return [records, update]; }

export default HRChallenges;
