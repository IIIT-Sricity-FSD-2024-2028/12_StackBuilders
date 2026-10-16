import { useState } from "react";

function HRChallengeModal({
  kind,
  onClose,
  onSubmit,
  onClearError,
  error = "",
  disabled = false,
}) {
  const challenge = kind === "challenge";
  const [validationMessage, setValidationMessage] = useState("");
  return (
    <div
      className="modal-overlay"
      role="presentation"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <div
        className="modal-card challenge-modal-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="challengeModalTitle"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button
          className="modal-close"
          disabled={disabled}
          onClick={onClose}
          type="button"
          aria-label="Close"
        >
          <i className="fa-solid fa-xmark" />
        </button>
        <section className="challenge-shell modal-shell">
          <div className="brand">StackBuilders</div>
          <header className="page-copy">
            <h1 id="challengeModalTitle">
              {challenge ? "Launch a New Challenge" : "Create a New Reward"}
            </h1>
            <p>
              {challenge
                ? "Create engaging wellness challenges for our team"
                : "Add the reward content employees should see in the rewards catalog."}
            </p>
          </header>
          <section className="form-card">
            <form
              className="challenge-form"
              onInvalidCapture={(event) =>
                setValidationMessage(
                  event.target.validationMessage ||
                    "Please check the highlighted form fields.",
                )
              }
              onChange={() => {
                setValidationMessage("");
                if (error) onClearError?.();
              }}
              onSubmit={(event) => {
                event.preventDefault();
                setValidationMessage("");
                onSubmit(Object.fromEntries(new FormData(event.currentTarget)));
              }}
            >
              {!challenge && (
                <Field
                  name="imageUrl"
                  label="Image URL"
                  icon="fa-regular fa-image"
                  type="url"
                  placeholder="https://example.com/reward-image.jpg"
                />
              )}
              <Field
                name="name"
                label={challenge ? "Challenge Name" : "Reward Name"}
                icon="fa-regular fa-bookmark"
                placeholder={
                  challenge ? "Enter Challenge Name" : "Enter Reward Name"
                }
              />
              {challenge ? (
                <>
                  <Field
                    name="type"
                    label="Challenge Type"
                    icon="fa-regular fa-bookmark"
                    placeholder="Enter Challenge Title"
                  />
                  <Field
                    name="reward"
                    label="Reward"
                    icon="fa-solid fa-award"
                    type="number"
                    min="1"
                    step="1"
                    placeholder="Enter reward points"
                  />
                  <Field
                    name="deadline"
                    label="Deadline"
                    icon="fa-regular fa-calendar"
                    type="date"
                    min={todayDate()}
                    required={false}
                  />
                  <Field
                    name="goal"
                    label="Goal"
                    icon="fa-regular fa-circle-dot"
                    placeholder="Enter Goal (e.g., 10000 steps)"
                  />
                </>
              ) : (
                <>
                  <Field
                    name="description"
                    label="Reward Description"
                    icon="fa-regular fa-pen-to-square"
                    placeholder="Describe the reward employees will receive"
                  />
                  <Field
                    name="points"
                    label="Points Needed"
                    icon="fa-solid fa-award"
                    type="number"
                    min="1"
                    step="1"
                    placeholder="e.g., 800"
                  />
                  <Field
                    name="claimableCount"
                    label="Number of People Who Can Claim"
                    icon="fa-solid fa-users"
                    type="number"
                    min="1"
                    step="1"
                    placeholder="e.g., 50"
                  />
                </>
              )}
              <div className="form-actions">
                <button
                  className="submit-btn"
                  disabled={disabled}
                  type="submit"
                >
                  <i
                    className={
                      challenge ? "fa-solid fa-trophy" : "fa-solid fa-gift"
                    }
                  />{" "}
                  {disabled
                    ? "Saving…"
                    : challenge
                      ? "Launch Challenge"
                      : "Save Reward"}
                </button>
                <button
                  className="back-btn"
                  disabled={disabled}
                  onClick={onClose}
                  type="button"
                >
                  Back
                </button>
              </div>
              {(validationMessage || error) && (
                <p className="form-message" role="alert" aria-live="assertive">
                  {validationMessage || error}
                </p>
              )}
            </form>
          </section>
        </section>
      </div>
    </div>
  );
}

function todayDate() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function Field({ name, label, icon, required = true, ...props }) {
  return (
    <div className="field-group">
      <label htmlFor={`hr-${name}`}>
        <i className={icon} aria-hidden="true" /> {label}
      </label>
      <input id={`hr-${name}`} name={name} required={required} {...props} />
    </div>
  );
}

export default HRChallengeModal;
