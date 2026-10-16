import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import RouteLoadingScreen from "../../components/RouteLoadingScreen.jsx";
import usePageStylesheets from "../../hooks/usePageStylesheets.js";
import HRNavbar from "./components/HRNavbar.jsx";
import hrApi from "./hrApi.js";
import { getCurrentHrCompanyContext } from "./hrUtils.js";

const plans = {
  starter: { name: "Starter", price: 100, employeeLimit: 100, expertLimit: 10 },
  business: {
    name: "Business",
    price: 200,
    employeeLimit: 1000,
    expertLimit: 50,
  },
  enterprise: {
    name: "Enterprise",
    price: 300,
    employeeLimit: 10000,
    expertLimit: 100,
  },
};

function HRPayment() {
  const stylesReady = usePageStylesheets([
    "/hr-dashboard-legacy.css",
    "/hr-payment-legacy.css",
  ]);
  const [params] = useSearchParams();
  const planId = params.get("plan") || "starter";
  const plan = useMemo(() => plans[planId], [planId]);
  const company = getCurrentHrCompanyContext();
  const [cardName, setCardName] = useState(company.hrName);
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  if (!stylesReady) return <RouteLoadingScreen />;

  if (!plan) {
    return (
      <div className="page-shell">
        <HRNavbar activeSection="pricing" />
        <div className="payment-container">
          <div className="payment-card">
            <h2>Invalid plan</h2>
            <Link className="continue-btn" to="/hr/pricing">
              Back to pricing
            </Link>
          </div>
        </div>
      </div>
    );
  }

  async function submitPayment(event) {
    event.preventDefault();
    if (!company.companyName) {
      setError("Your HR account is not linked to a company.");
      return;
    }
    setProcessing(true);
    setError("");
    try {
      const [subscriptions, payments] = await Promise.all([
        hrApi.getSubscriptions(),
        hrApi.getPayments(),
      ]);
      const now = Date.now();
      const subscription = {
        id: `SUB-${now}`,
        companyId: company.companyId,
        companyName: company.companyName,
        planId,
        planName: plan.name,
        price: plan.price,
        employeeLimit: plan.employeeLimit,
        expertLimit: plan.expertLimit,
        status: "active",
        subscribedAt: now,
      };
      const nextSubscriptions = (subscriptions || [])
        .filter((item) => !isSameCompany(item, company))
        .concat(subscription);
      const payment = {
        id: `PAY-${now}`,
        companyId: company.companyId,
        companyName: company.companyName,
        planId,
        planName: plan.name,
        amount: plan.price,
        status: "completed",
        paidAt: now,
      };
      const nextPayments = [...(payments || []), payment];
      await Promise.all([
        hrApi.saveSubscriptions(nextSubscriptions),
        hrApi.savePayments(nextPayments),
      ]);
      setSuccess(true);
    } catch (paymentError) {
      setError(
        paymentError.message ||
          "An error occurred during payment processing. Please try again.",
      );
    } finally {
      setProcessing(false);
    }
  }

  return (
    <div className="page-shell">
      <HRNavbar activeSection="pricing" />
      <div className="payment-container">
        {!success ? (
          <form className="payment-card" onSubmit={submitPayment}>
            <h2>Complete Your Payment</h2>
            <p className="payment-subtitle">
              You're subscribing to the <strong>{plan.name}</strong> plan
            </p>
            <div className="plan-summary">
              <div className="plan-info">
                <h3>{plan.name} Plan</h3>
                <p>
                  {plan.employeeLimit.toLocaleString()} employees ·{" "}
                  {plan.expertLimit} experts
                </p>
              </div>
              <div className="plan-total">₹{plan.price}</div>
            </div>
            {error && <p className="payment-error">{error}</p>}
            <div className="form-group">
              <label>Company</label>
              <input
                readOnly
                style={{
                  background: "#f9f9f9",
                  color: "#666",
                  cursor: "not-allowed",
                }}
                value={company.companyName}
              />
            </div>
            <div className="form-group">
              <label>Cardholder Name</label>
              <input
                onChange={(event) => setCardName(event.target.value)}
                placeholder="Jane Doe"
                required
                value={cardName}
              />
            </div>
            <div className="form-group">
              <label>Card Number</label>
              <input
                defaultValue="4242 4242 4242 4242"
                maxLength="19"
                required
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Expiry Date</label>
                <input defaultValue="12/28" maxLength="5" required />
              </div>
              <div className="form-group">
                <label>CVV</label>
                <input defaultValue="123" maxLength="4" required />
              </div>
            </div>
            <button className="pay-btn" disabled={processing} type="submit">
              <i className="fa fa-lock" />
              &nbsp; {processing ? "Processing…" : `Pay ₹${plan.price}/mo`}
            </button>
          </form>
        ) : (
          <div className="payment-card payment-success">
            <div className="check-circle">
              <i className="fa fa-check" />
            </div>
            <h2>Payment Successful!</h2>
            <p>
              Your <strong>{plan.name}</strong> plan is now active for{" "}
              <strong>{company.companyName}</strong>.
            </p>
            <Link className="continue-btn" to="/hr">
              Back to Dashboard
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

function isSameCompany(record, company) {
  const recordCompanyId = String(record.companyId || "").trim();
  const companyId = String(company.companyId || "").trim();
  if (recordCompanyId && companyId) return recordCompanyId === companyId;
  return (
    String(record.companyName || "")
      .trim()
      .toLowerCase() ===
    String(company.companyName || "")
      .trim()
      .toLowerCase()
  );
}

export default HRPayment;
