import HRNavbar from "./components/HRNavbar.jsx";
import "./hr-pricing.css";

const plans = [
  {
    id: "starter",
    name: "Starter",
    price: "$100",
    employeeLimit: "Up to 100 Employees",
    expertLimit: "Up to 10 Experts",
  },
  {
    id: "business",
    name: "Business",
    price: "$200",
    employeeLimit: "Up to 1,000 Employees",
    expertLimit: "Up to 50 Experts",
    featured: true,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: "$300",
    employeeLimit: "Up to 10,000 Employees",
    expertLimit: "Up to 100 Experts",
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
  const currentPlan = getCurrentPlan();

  return (
    <div className="hr-pricing-page">
      <HRNavbar activeSection="pricing" />

      <section className="hr-pricing-hero">
        <h1>Company Subscription</h1>
        <p>
          Every plan includes all platform features. Choose based on the number of employees
          and wellness experts you can add.
        </p>
      </section>

      <section className="hr-plans-grid" aria-label="Company subscription plans">
        {plans.map((plan) => {
          const isCurrent = currentPlan === plan.id;

          return (
            <article
              className={`hr-plan-card${plan.featured ? " featured" : ""}`}
              key={plan.id}
            >
              <div className="hr-plan-name">{plan.name}</div>
              <div className="hr-plan-price">
                {plan.price}
                <span>/mo</span>
              </div>

              <div className="hr-plan-limits">
                <div className="hr-limit-badge">
                  <span aria-hidden="true">♣</span>
                  {plan.employeeLimit}
                </div>
                <div className="hr-limit-badge">
                  <span aria-hidden="true">♙</span>
                  {plan.expertLimit}
                </div>
              </div>

              <ul className="hr-plan-features">
                {features.map((feature) => (
                  <li key={feature}>
                    <span aria-hidden="true">✓</span>
                    {feature}
                  </li>
                ))}
              </ul>

              <a
                className={`hr-plan-button${isCurrent ? " current" : ""}`}
                href={isCurrent ? undefined : `/hr/payment?plan=${plan.id}`}
                onClick={(event) => {
                  if (isCurrent) event.preventDefault();
                }}
              >
                {isCurrent ? "✓ Current Plan" : `Choose ${plan.name}`}
              </a>
            </article>
          );
        })}
      </section>
    </div>
  );
}

function getCurrentPlan() {
  try {
    const subscription = JSON.parse(window.localStorage.getItem("stackbuilders.hr.subscription"));
    if (subscription?.planId) return subscription.planId;
  } catch {
    // Fall through to the legacy default used by the static mockup.
  }

  return "business";
}

export default HRPricing;
