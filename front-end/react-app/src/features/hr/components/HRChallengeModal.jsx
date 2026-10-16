function HRChallengeModal({ kind, onClose, onSubmit }) {
  const challenge = kind === "challenge";
  return (
    <div className="hr-challenge-modal" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="hr-challenge-modal-card" role="dialog" aria-modal="true" aria-labelledby="hr-challenge-modal-title">
        <button className="hr-modal-close" onClick={onClose} type="button" aria-label="Close">×</button>
        <div className="hr-modal-brand">StackBuilders</div>
        <h2 id="hr-challenge-modal-title">{challenge ? "Launch a New Challenge" : "Create a New Reward"}</h2>
        <p>{challenge ? "Create engaging wellness challenges for our team" : "Add the reward content employees should see in the rewards catalog."}</p>
        <form onSubmit={(event) => { event.preventDefault(); onSubmit(Object.fromEntries(new FormData(event.currentTarget))); }}>
          {!challenge && <Field name="imageUrl" label="Image URL" type="url" placeholder="https://example.com/reward.jpg" />}
          <Field name="name" label={challenge ? "Challenge Name" : "Reward Name"} placeholder="Enter a name" />
          {challenge ? <><Field name="type" label="Challenge Type" placeholder="Enter Challenge Title" /><Field name="reward" label="Reward" type="number" min="1" placeholder="Enter reward points" /><Field name="deadline" label="Deadline" type="date" required={false} /><Field name="goal" label="Goal" placeholder="Enter Goal (e.g., 10000 steps)" /></> : <><Field name="description" label="Reward Description" placeholder="Describe the reward employees will receive" /><Field name="points" label="Points Needed" type="number" min="1" placeholder="e.g., 800" /><Field name="claimableCount" label="Number of People Who Can Claim" type="number" min="1" placeholder="e.g., 50" /></>}
          <div className="hr-modal-actions"><button className="hr-submit-button" type="submit">{challenge ? "Launch Challenge" : "Save Reward"}</button><button className="hr-back-btn" onClick={onClose} type="button">Back</button></div>
        </form>
      </section>
    </div>
  );
}

function Field({ name, label, required = true, ...props }) { return <label className="hr-challenge-field"><span><i aria-hidden="true">{label === "Deadline" ? "◷" : label === "Goal" ? "◉" : "▧"}</i>{label}</span><input name={name} required={required} {...props} /></label>; }

export default HRChallengeModal;
