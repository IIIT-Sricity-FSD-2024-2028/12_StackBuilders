import { useCallback, useEffect, useMemo, useState } from "react";
import RouteLoadingScreen from "../../components/RouteLoadingScreen.jsx";
import usePageStylesheets from "../../hooks/usePageStylesheets.js";
import HRChallengeCard from "./components/HRChallengeCard.jsx";
import HRChallengeModal from "./components/HRChallengeModal.jsx";
import HRNavbar from "./components/HRNavbar.jsx";
import HRRewardCard from "./components/HRRewardCard.jsx";
import hrApi from "./hrApi.js";
import { getCurrentHrCompanyContext } from "./hrUtils.js";
import useAutoRefresh from "../../hooks/useAutoRefresh.js";
import { useRoleAccess } from "../shared/roleAccessContext.jsx";

function HRChallenges() {
  const { hasPermission } = useRoleAccess();
  const canCreate = hasPermission("challenge-management-create");
  const canDelete = hasPermission("challenge-management-delete");
  const stylesReady = usePageStylesheets("/hr-challenges-legacy.css");
  const [challenges, setChallenges] = useState([]);
  const [rewards, setRewards] = useState([]);
  const [modal, setModal] = useState(null);
  const [challengePage, setChallengePage] = useState(0);
  const [rewardPage, setRewardPage] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const pageSize = 3;

  const loadData = useCallback(async (silent = false) => {
    try {
      const companyContext = getCurrentHrCompanyContext();
      const [nextChallenges, nextRewards] = await Promise.all([
        hrApi.getChallenges(companyContext),
        hrApi.getRewards(companyContext),
      ]);
      setChallenges(nextChallenges || []);
      setRewards(nextRewards || []);
      setError("");
    } catch (loadError) {
      if (!silent)
        setError(loadError.message || "Could not load challenges and rewards.");
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);
  useAutoRefresh(() => loadData(true), "hr-challenges");

  const visibleChallenges = useMemo(
    () =>
      challenges.slice(
        challengePage * pageSize,
        challengePage * pageSize + pageSize,
      ),
    [challenges, challengePage],
  );
  const visibleRewards = useMemo(
    () =>
      rewards.slice(rewardPage * pageSize, rewardPage * pageSize + pageSize),
    [rewards, rewardPage],
  );

  async function createRecord(data) {
    if (!canCreate) return;
    setSaving(true);
    setError("");
    setFormError("");
    try {
      if (modal === "challenge") {
        const company = getCurrentHrCompanyContext();
        const created = await hrApi.createChallenge({
          ...data,
          companyId: company.companyId,
          companyName: company.companyName,
        });
        setChallenges((current) => [created, ...current]);
        setChallengePage(0);
      } else {
        const company = getCurrentHrCompanyContext();
        const created = await hrApi.createReward({
          ...data,
          companyId: company.companyId,
          companyName: company.companyName,
          claimedCount: "0",
        });
        setRewards((current) => [created, ...current]);
        setRewardPage(0);
      }
      setModal(null);
    } catch (saveError) {
      setFormError(
        saveError.message ||
          "Could not save this record. Check the form and try again.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function deleteRecord(kind, id) {
    if (!canDelete) return;
    setError("");
    try {
      if (kind === "challenge") {
        await hrApi.deleteChallenge(id);
        setChallenges((current) => current.filter((item) => item.id !== id));
      } else {
        await hrApi.deleteReward(id);
        setRewards((current) => current.filter((item) => item.id !== id));
      }
    } catch (deleteError) {
      setError(deleteError.message || "Could not delete this record.");
    }
  }

  if (!stylesReady) return <RouteLoadingScreen />;

  return (
    <div className="page-wrapper">
      <header className="page-topbar">
        <HRNavbar activeSection="challenges" />
      </header>
      <main className="challenge-shell">
        <section className="challenge-hero">
          <div className="hero-left">
            <span className="hero-icon" aria-hidden="true">
              <i className="fa-solid fa-trophy" />
            </span>
            <div>
              <h1>Challenges &amp; Rewards</h1>
              <p>Track your progress and earn points</p>
            </div>
          </div>
        </section>
        {error && <p className="form-message">{error}</p>}

        <ChallengeBoard
          title="Active Challenges"
          subtitle="Complete challenges to earn rewards"
          actionLabel="Create New Challenge"
          onCreate={() => {
            setFormError("");
            setModal("challenge");
          }}
          canCreate={canCreate}
        >
          <div className="challenges-grid">
            {visibleChallenges.length ? (
              visibleChallenges.map((challenge) => (
                <HRChallengeCard
                  challenge={challenge}
                  key={challenge.id}
                  canDelete={canDelete}
                  onDelete={(id) => deleteRecord("challenge", id)}
                />
              ))
            ) : (
              <EmptyState message="No active challenges yet. Create a challenge to see it here." />
            )}
          </div>
          <Pager
            page={challengePage}
            total={challenges.length}
            pageSize={pageSize}
            onChange={setChallengePage}
          />
        </ChallengeBoard>

        <ChallengeBoard
          title="Rewards Catalog"
          subtitle="Highlight the incentives employees can unlock by completing wellness goals."
          actionLabel="Create New Reward"
          onCreate={() => {
            setFormError("");
            setModal("reward");
          }}
          canCreate={canCreate}
          reward
        >
          <div className="rewards-grid">
            {visibleRewards.length ? (
              visibleRewards.map((reward) => (
                <HRRewardCard
                  reward={reward}
                  key={reward.id}
                  canDelete={canDelete}
                  onDelete={(id) => deleteRecord("reward", id)}
                />
              ))
            ) : (
              <EmptyState message="No rewards in the catalog yet. Create a reward to display it here." />
            )}
          </div>
          <Pager
            page={rewardPage}
            total={rewards.length}
            pageSize={pageSize}
            onChange={setRewardPage}
          />
        </ChallengeBoard>
      </main>
      {modal && (
        <HRChallengeModal
          disabled={saving}
          error={formError}
          kind={modal}
          onClearError={() => setFormError("")}
          onClose={() => {
            if (!saving) {
              setFormError("");
              setModal(null);
            }
          }}
          onSubmit={createRecord}
        />
      )}
    </div>
  );
}

function ChallengeBoard({
  title,
  subtitle,
  actionLabel,
  onCreate,
  canCreate = true,
  reward,
  children,
}) {
  return (
    <section className={`challenge-board${reward ? " rewards-board" : ""}`}>
      <div className="board-toolbar">
        <div className="board-copy">
          <h2>{title}</h2>
          <p>{subtitle}</p>
        </div>
        {canCreate && (
          <button
            className={`btn-create${reward ? " btn-create-reward" : ""}`}
            onClick={onCreate}
            type="button"
          >
            <span className="icon-plus">+</span>
            {actionLabel}
          </button>
        )}
      </div>
      {children}
    </section>
  );
}

function EmptyState({ message }) {
  return <div className="empty-state">{message}</div>;
}
function Pager({ page, total, pageSize, onChange }) {
  const max = Math.max(0, Math.ceil(total / pageSize) - 1);
  return (
    <div className="section-pager">
      <button
        className="reward-nav-btn"
        disabled={page === 0}
        onClick={() => onChange(page - 1)}
        type="button"
      >
        Previous
      </button>
      <button
        className="reward-nav-btn"
        disabled={page >= max}
        onClick={() => onChange(page + 1)}
        type="button"
      >
        Next
      </button>
    </div>
  );
}

export default HRChallenges;
