const PLAN_TYPES = [
  { label: "Starter", keys: ["starter"] },
  { label: "Business", keys: ["business"] },
  { label: "Enterprise", keys: ["enterprise"] },
];

export function buildPlanRevenue(payments = []) {
  return PLAN_TYPES.map(({ label, keys }) => ({
    label,
    value: payments.reduce((total, payment) => {
      const identifier = String(payment.planName || payment.planId || payment.plan || "")
        .trim()
        .toLowerCase();
      return keys.includes(identifier) ? total + (Number(payment.amount) || 0) : total;
    }, 0),
  }));
}
