import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import HRNavbar from "./components/HRNavbar.jsx";
import "./hr-payment.css";

const PLAN_STORAGE_KEY = "stackbuilders.subscriptions.v1";
const PAYMENT_STORAGE_KEY = "stackbuilders.payments.v1";
const PROFILE_STORAGE_KEY = "stackbuilders.hr.profiles.v2";
const SESSION_STORAGE_KEY = "stackbuilders.hrSession.v1";

const plans = {
  starter: {
    id: "starter",
    name: "Starter",
    price: 100,
    employeeLimit: 100,
    expertLimit: 10,
  },
  business: {
    id: "business",
    name: "Business",
    price: 200,
    employeeLimit: 1000,
    expertLimit: 50,
  },
  enterprise: {
    id: "enterprise",
    name: "Enterprise",
    price: 300,
    employeeLimit: 10000,
    expertLimit: 100,
  },
};

function HRPayment() {
  const [searchParams] = useSearchParams();
  const selectedPlanId = searchParams.get("plan") || "starter";
  const selectedPlan = plans[selectedPlanId] || plans.starter;
  const profile = useMemo(readCurrentHrProfile, []);
  const [form, setForm] = useState({
    cardName: profile.name,
    cardNumber: "4242 4242 4242 4242",
    cardExpiry: "12/28",
    cardCvv: "123",
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const companyName = profile.companyName || "Stack Builders";

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function submitPayment(event) {
    event.preventDefault();
    setError("");

    if (!companyName) {
      setError("Error: No company associated with your account.");
      return;
    }

    if (!form.cardName.trim() || !form.cardNumber.trim() || !form.cardExpiry.trim() || !form.cardCvv.trim()) {
      setError("Enter all payment details before continuing.");
      return;
    }

    setIsProcessing(true);

    try {
      subscribeCompany(companyName, selectedPlan);
      setSuccess(true);
    } catch {
      setError("An error occurred during payment processing. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <div className="hr-payment-page">
      <HRNavbar />

      <main className="hr-payment-container">
        {!success ? (
          <form className="hr-payment-card" onSubmit={submitPayment}>
            <h2>Complete Your Payment</h2>
            <p className="hr-payment-subtitle">
              You're subscribing to the <strong>{selectedPlan.name}</strong> plan
            </p>

            <section className="hr-payment-plan-summary">
              <div>
                <h3>{selectedPlan.name} Plan</h3>
                <p>
                  {selectedPlan.employeeLimit.toLocaleString()} employees ·{" "}
                  {selectedPlan.expertLimit} experts
                </p>
              </div>
              <strong>${selectedPlan.price}</strong>
            </section>

            <PaymentField disabled label="Company" value={companyName} />
            <PaymentField
              label="Cardholder Name"
              placeholder="Jane Doe"
              value={form.cardName}
              onChange={(value) => updateField("cardName", value)}
            />
            <PaymentField
              label="Card Number"
              maxLength={19}
              placeholder="4242 4242 4242 4242"
              value={form.cardNumber}
              onChange={(value) => updateField("cardNumber", value)}
            />

            <div className="hr-payment-row">
              <PaymentField
                label="Expiry Date"
                maxLength={5}
                placeholder="MM/YY"
                value={form.cardExpiry}
                onChange={(value) => updateField("cardExpiry", value)}
              />
              <PaymentField
                label="CVV"
                maxLength={4}
                placeholder="123"
                value={form.cardCvv}
                onChange={(value) => updateField("cardCvv", value)}
              />
            </div>

            {error && <p className="hr-payment-error">{error}</p>}

            <button className="hr-payment-button" disabled={isProcessing} type="submit">
              {isProcessing ? "Processing..." : `🔒 Pay $${selectedPlan.price}/mo`}
            </button>
          </form>
        ) : (
          <section className="hr-payment-card hr-payment-success">
            <div className="hr-payment-check">✓</div>
            <h2>Payment Successful!</h2>
            <p>
              Your <strong>{selectedPlan.name}</strong> plan is now active for{" "}
              <strong>{companyName}</strong>.
            </p>
            <a href="/hr">Back to Dashboard</a>
          </section>
        )}
      </main>
    </div>
  );
}

function PaymentField({ disabled, label, maxLength, onChange, placeholder, value }) {
  return (
    <label className="hr-payment-field">
      <span>{label}</span>
      <input
        disabled={disabled}
        maxLength={maxLength}
        onChange={(event) => onChange?.(event.target.value)}
        placeholder={placeholder}
        value={value}
      />
    </label>
  );
}

function subscribeCompany(companyName, plan) {
  const now = Date.now();
  const subscriptions = readArray(PLAN_STORAGE_KEY).filter(
    (subscription) =>
      !subscription.companyName ||
      subscription.companyName.toLowerCase() !== companyName.toLowerCase()
  );
  const payments = readArray(PAYMENT_STORAGE_KEY).filter(
    (payment) => !payment.companyName || payment.companyName.toLowerCase() !== companyName.toLowerCase()
  );

  subscriptions.push({
    id: `SUB-${now}`,
    companyName,
    planId: plan.id,
    planName: plan.name,
    price: plan.price,
    employeeLimit: plan.employeeLimit,
    expertLimit: plan.expertLimit,
    status: "active",
    subscribedAt: now,
  });

  payments.push({
    id: `PAY-${now}`,
    companyName,
    planId: plan.id,
    planName: plan.name,
    amount: plan.price,
    status: "completed",
    paidAt: now,
  });

  window.localStorage.setItem(PLAN_STORAGE_KEY, JSON.stringify(subscriptions));
  window.localStorage.setItem(PAYMENT_STORAGE_KEY, JSON.stringify(payments));
  window.localStorage.setItem(
    "stackbuilders.hr.subscription",
    JSON.stringify({ companyName, planId: plan.id, planName: plan.name })
  );
}

function readArray(key) {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(key) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function readCurrentHrProfile() {
  const profiles = readArray(PROFILE_STORAGE_KEY);
  const session = readSession();
  const matchedProfile = session?.hrId
    ? profiles.find((profile) => profile.id === session.hrId)
    : null;

  return {
    name: "HR",
    email: "hr@example.com",
    companyName: "Stack Builders",
    ...(matchedProfile || profiles[0] || {}),
  };
}

function readSession() {
  try {
    const raw = window.sessionStorage.getItem(SESSION_STORAGE_KEY)
      || window.localStorage.getItem(SESSION_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export default HRPayment;
