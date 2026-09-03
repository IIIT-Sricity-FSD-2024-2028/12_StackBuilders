(function () {
  const PLAN_STORAGE_KEY = "stackbuilders.subscriptions.v1";
  const PAYMENT_STORAGE_KEY = "stackbuilders.payments.v1";
  const COMPANY_STORAGE_KEY = "stack-builders-companies";
  const EMPLOYEE_STORAGE_KEY = "stackbuilders.hr.employees";
  const EXPERT_STORAGE_KEY = "stackbuilders.hr.experts";

  // Every HR plan includes the complete feature set. Plans differ only by capacity.
  const ALL_FEATURES = [
    "Analytics & reports",
    "Email and priority support",
    "Wellness check-ins",
    "Live sessions & video library",
    "Custom challenges",
    "Dedicated account manager",
    "API access & integrations"
  ];

  // --- PLAN DEFINITIONS ---
  const PLANS = {
    starter: {
      id: "starter",
      name: "Starter",
      price: 100,
      employeeLimit: 100,
      expertLimit: 10,
      features: ALL_FEATURES.slice()
    },
    business: {
      id: "business",
      name: "Business",
      price: 200,
      employeeLimit: 1000,
      expertLimit: 50,
      features: ALL_FEATURES.slice()
    },
    enterprise: {
      id: "enterprise",
      name: "Enterprise",
      price: 300,
      employeeLimit: 10000,
      expertLimit: 100,
      features: ALL_FEATURES.slice()
    }
  };

  // --- STORAGE HELPERS ---
  function readSubscriptions() {
    try {
      var raw = localStorage.getItem(PLAN_STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) { return []; }
  }

  function writeSubscriptions(subs) {
    try {
      localStorage.setItem(PLAN_STORAGE_KEY, JSON.stringify(subs));
    } catch (e) {}
    if (window.appApiClient?.request) {
      return window.appApiClient.request("/subscriptions/bulk", {
        method: "PUT",
        json: subs
      }).catch(function(e) { console.error("Failed to sync subscriptions:", e); });
    }
    return Promise.resolve();
  }

  function readPayments() {
    try {
      var raw = localStorage.getItem(PAYMENT_STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) { return []; }
  }

  function writePayments(payments) {
    try {
      localStorage.setItem(PAYMENT_STORAGE_KEY, JSON.stringify(payments));
    } catch (e) {}
    if (window.appApiClient?.request) {
      return window.appApiClient.request("/subscriptions/payments/bulk", {
        method: "PUT",
        json: payments
      }).catch(function(e) { console.error("Failed to sync payments:", e); });
    }
    return Promise.resolve();
  }

  // --- SUBSCRIPTION MANAGEMENT ---
  function getCompanySubscription(companyName) {
    var subs = readSubscriptions();
    for (var i = 0; i < subs.length; i++) {
      if (subs[i].companyName && subs[i].companyName.toLowerCase() === companyName.toLowerCase()) {
        return subs[i];
      }
    }
    return null;
  }

  function getAllSubscriptions() {
    return readSubscriptions();
  }

  async function subscribe(companyName, planId) {
    var plan = PLANS[planId];
    if (!plan) return { ok: false, error: "Invalid plan." };

    var subs = readSubscriptions();
    // Remove existing subscription for this company
    subs = subs.filter(function (s) {
      return !s.companyName || s.companyName.toLowerCase() !== companyName.toLowerCase();
    });

    var now = Date.now();
    var subscription = {
      id: "SUB-" + now,
      companyName: companyName,
      planId: planId,
      planName: plan.name,
      price: plan.price,
      employeeLimit: plan.employeeLimit,
      expertLimit: plan.expertLimit,
      status: "active",
      subscribedAt: now
    };
    subs.push(subscription);
    await writeSubscriptions(subs);

    // Remove old payments for this company (plan change = old revenue removed)
    var payments = readPayments();
    payments = payments.filter(function (p) {
      return !p.companyName || p.companyName.toLowerCase() !== companyName.toLowerCase();
    });
    payments.push({
      id: "PAY-" + now,
      companyName: companyName,
      planId: planId,
      planName: plan.name,
      amount: plan.price,
      status: "completed",
      paidAt: now
    });
    await writePayments(payments);

    return { ok: true, subscription: subscription };
  }

  // --- LIMIT CHECKING ---
  function getCompanyEmployeeCount(companyName) {
    try {
      var raw = localStorage.getItem(EMPLOYEE_STORAGE_KEY);
      var employees = raw ? JSON.parse(raw) : [];
      return employees.filter(function (e) {
        return e.company && e.company.toLowerCase() === companyName.toLowerCase();
      }).length;
    } catch (e) { return 0; }
  }

  function getCompanyExpertCount(companyName) {
    try {
      var raw = localStorage.getItem(EXPERT_STORAGE_KEY);
      var experts = raw ? JSON.parse(raw) : [];
      return experts.filter(function (e) {
        return e.company && e.company.toLowerCase() === companyName.toLowerCase();
      }).length;
    } catch (e) { return 0; }
  }

  function canAddEmployee(companyName) {
    var sub = getCompanySubscription(companyName);
    if (!sub) return { allowed: false, reason: "No active subscription. Please subscribe to a plan first.", limit: 0, current: 0 };
    var current = getCompanyEmployeeCount(companyName);
    if (current >= sub.employeeLimit) {
      return {
        allowed: false,
        reason: "Employee limit reached (" + current + "/" + sub.employeeLimit + ") on the " + sub.planName + " plan. Please upgrade to add more employees.",
        limit: sub.employeeLimit,
        current: current
      };
    }
    return { allowed: true, limit: sub.employeeLimit, current: current };
  }

  function canAddExpert(companyName) {
    var sub = getCompanySubscription(companyName);
    if (!sub) return { allowed: false, reason: "No active subscription. Please subscribe to a plan first.", limit: 0, current: 0 };
    var current = getCompanyExpertCount(companyName);
    if (current >= sub.expertLimit) {
      return {
        allowed: false,
        reason: "Wellness expert limit reached (" + current + "/" + sub.expertLimit + ") on the " + sub.planName + " plan. Please upgrade to add more experts.",
        limit: sub.expertLimit,
        current: current
      };
    }
    return { allowed: true, limit: sub.expertLimit, current: current };
  }

  // --- REVENUE DATA ---
  function getRevenueData() {
    var payments = readPayments();
    var subs = readSubscriptions();

    var totalRevenue = 0;
    var planBreakdown = { starter: 0, business: 0, enterprise: 0 };
    var monthlyRevenue = {};

    payments.forEach(function (p) {
      totalRevenue += p.amount;
      if (planBreakdown.hasOwnProperty(p.planId)) {
        planBreakdown[p.planId] += p.amount;
      }
      var d = new Date(p.paidAt);
      var key = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0");
      monthlyRevenue[key] = (monthlyRevenue[key] || 0) + p.amount;
    });

    var activeSubs = subs.filter(function (s) { return s.status === "active"; }).length;

    return {
      totalRevenue: totalRevenue,
      activeSubscriptions: activeSubs,
      avgRevenuePerCompany: activeSubs > 0 ? Math.round(totalRevenue / activeSubs) : 0,
      planBreakdown: planBreakdown,
      monthlyRevenue: monthlyRevenue,
      payments: payments,
      subscriptions: subs
    };
  }

  // --- SYNC WITH BACKEND ---
  async function syncWithBackend() {
    if (!window.appApiClient?.request) return;
    try {
      var backendSubs = await window.appApiClient.request("/subscriptions");
      if (Array.isArray(backendSubs)) {
        localStorage.setItem(PLAN_STORAGE_KEY, JSON.stringify(backendSubs));
      }
    } catch (e) {
      console.error("Failed to sync subscriptions from backend:", e);
    }
    try {
      var backendPayments = await window.appApiClient.request("/subscriptions/payments");
      if (Array.isArray(backendPayments)) {
        localStorage.setItem(PAYMENT_STORAGE_KEY, JSON.stringify(backendPayments));
      }
    } catch (e) {
      console.error("Failed to sync payments from backend:", e);
    }
  }

  // --- EXPORT ---
  window.planStore = {
    PLANS: PLANS,
    readSubscriptions: readSubscriptions,
    getAllSubscriptions: getAllSubscriptions,
    getCompanySubscription: getCompanySubscription,
    subscribe: subscribe,
    canAddEmployee: canAddEmployee,
    canAddExpert: canAddExpert,
    getRevenueData: getRevenueData,
    syncWithBackend: syncWithBackend,
    readPayments: readPayments
  };

  // Auto-sync on page load — clear stale localStorage first, then pull from backend
  window.addEventListener("DOMContentLoaded", async function() {
    if (window.appApiClient?.request) {
      // Clear stale data immediately so no page reads old values
      localStorage.removeItem(PLAN_STORAGE_KEY);
      localStorage.removeItem(PAYMENT_STORAGE_KEY);
      await syncWithBackend();
    }
  });
})();
