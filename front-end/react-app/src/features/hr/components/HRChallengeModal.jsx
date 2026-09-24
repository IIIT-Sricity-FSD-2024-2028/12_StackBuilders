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
          {challenge ? <><Field name="type" label="Challenge Type" placeholder="Fitness" /><Field name="reward" label="Reward points" type="number" min="1" /><Field name="deadline" label="Deadline" type="date" /><Field name="goal" label="Goal" placeholder="Enter goal" /></> : <><Field name="description" label="Reward Description" placeholder="Describe the reward" /><Field name="points" label="Points Needed" type="number" min="1" /><Field name="claimableCount" label="Number of People Who Can Claim" type="number" min="1" /></>}
          <div className="hr-modal-actions"><button className="hr-submit-button" type="submit">{challenge ? "Launch Challenge" : "Save Reward"}</button><button className="hr-back-btn" onClick={onClose} type="button">Back</button></div>
        </form>
      </section>
    </div>
  );
}

function Field({ name, label, ...props }) { return <label className="hr-challenge-field"><span>{label}</span><input name={name} required {...props} /></label>; }

export default HRChallengeModal;
