import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import RouteLoadingScreen from "../../components/RouteLoadingScreen.jsx";
import usePageStylesheets from "../../hooks/usePageStylesheets.js";
import HRNavbar from "./components/HRNavbar.jsx";
import hrApi from "./hrApi.js";
import { getCurrentHrCompanyContext } from "./hrUtils.js";
import useAutoRefresh from "../../hooks/useAutoRefresh.js";

const plans = [
  {
    id: "starter",
    name: "Starter",
    price: 100,
    employeeLimit: 100,
    expertLimit: 10,
    style: "outline",
  },
  {
    id: "business",
    name: "Business",
    price: 200,
    employeeLimit: 1000,
    expertLimit: 50,
    style: "primary",
    featured: true,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: 300,
    employeeLimit: 10000,
    expertLimit: 100,
    style: "outline",
  },
];

const features = [
  "All platform features included",
  "Analytics & reports",
  "Wellness check-ins",
  "Live sessions & video library",
  "Custom challenges",
  "API access & integrations",
];

function HRPricing() {
  const stylesReady = usePageStylesheets([
    "/hr-dashboard-legacy.css",
    "/hr-pricing-legacy.css",
  ]);
  const [currentPlan, setCurrentPlan] = useState("");

  const loadCurrentPlan = () => {
    const company = getCurrentHrCompanyContext();
    const companyName = company.companyName.toLowerCase();
    return hrApi
      .getSubscriptions()
      .then((subscriptions) => {
        const subscription = (subscriptions || []).find(
          (item) =>
            String(item.status || "")
              .trim()
              .toLowerCase() === "active" &&
            ((company.companyId &&
              String(item.companyId || "").trim() === company.companyId) ||
              String(item.companyName || "")
                .trim()
                .toLowerCase() === companyName),
        );
        setCurrentPlan(subscription?.planId || "");
      })
      .catch(() => {});
  };

  useEffect(() => {
    loadCurrentPlan();
  }, []);
  useAutoRefresh(loadCurrentPlan, "hr-pricing");

  if (!stylesReady) return <RouteLoadingScreen />;

  return (
    <div className="page-shell">
      <HRNavbar activeSection="pricing" />
      <section className="pricing-hero">
        <h1>Company Subscription</h1>
        <p>
          Every plan includes all platform features. Choose based on the number
          of employees and wellness experts you can add.
        </p>
      </section>
      <section className="plans-grid">
        {plans.map((plan) => (
          <div
            className={`plan-card${plan.featured ? " featured" : ""}`}
            key={plan.id}
          >
            <div className="plan-name">{plan.name}</div>
            <div className="plan-price">
              ₹{plan.price}
              <span>/mo</span>
            </div>
            <div>
              <div className="limit-badge">
                <i className="fa fa-users" />
                &nbsp; Up to {plan.employeeLimit.toLocaleString()} Employees
              </div>
              <div className="limit-badge">
                <i className="fa fa-user-doctor" />
                &nbsp; Up to {plan.expertLimit} Experts
              </div>
            </div>
            <ul className="plan-features">
              {features.map((feature) => (
                <li key={feature}>
                  <i className="fa fa-check" />
                  {feature}
                </li>
              ))}
            </ul>
            {currentPlan === plan.id ? (
              <span className="choose-btn current-plan">✓ Current Plan</span>
            ) : (
              <Link
                className={`choose-btn ${plan.style}`}
                to={`/hr/payment?plan=${plan.id}`}
              >
                Choose {plan.name}
              </Link>
            )}
          </div>
        ))}
      </section>
    </div>
  );
}

export default HRPricing;
