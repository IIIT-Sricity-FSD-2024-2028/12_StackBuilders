import { useCallback, useEffect, useMemo, useState } from "react";
import HRChallengeOverview from "./components/HRChallengeOverview.jsx";
import HREmployeeManagement from "./components/HREmployeeManagement.jsx";
import HRExpertManagement from "./components/HRExpertManagement.jsx";
import HRModal from "./components/HRModal.jsx";
import HRNavbar from "./components/HRNavbar.jsx";
import HRStatCard from "./components/HRStatCard.jsx";
import DashboardProfileOverlay from "../../components/DashboardProfileOverlay.jsx";
import RouteLoadingScreen from "../../components/RouteLoadingScreen.jsx";
import usePageStylesheets from "../../hooks/usePageStylesheets.js";
import hrApi from "./hrApi.js";
import useAutoRefresh from "../../hooks/useAutoRefresh.js";
import { useRoleAccess } from "../shared/roleAccessContext.jsx";
import {
  getCurrentHrCompanyContext,
  isEmptyImportedRecord,
  normalizeImportedEmployee,
  normalizeImportedExpert,
  readSpreadsheetRows,
  requireHrCompanyContext,
  summarizeImportFailures,
} from "./hrUtils.js";

function HRDashboard() {
  const { hasPermission } = useRoleAccess();
  const canReadReports = hasPermission("reports-read");
  const canReadUsers = hasPermission("user-management-read");
  const canCreateUsers = hasPermission("user-management-create");
  const canDeleteUsers = hasPermission("user-management-delete");
  const canReadChallenges = hasPermission("challenge-management-read");
  const stylesReady = usePageStylesheets("/hr-dashboard-legacy.css");
  const [employees, setEmployees] = useState([]);
  const [experts, setExperts] = useState([]);
  const [challenges, setChallenges] = useState([]);
  const [liveSessions, setLiveSessions] = useState([]);
  const [rewards, setRewards] = useState([]);
  const [employeeSearch, setEmployeeSearch] = useState("");
  const [expertSearch, setExpertSearch] = useState("");
  const [selectedChallengeId, setSelectedChallengeId] = useState("");
  const [activeModal, setActiveModal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState("");
  const [employeeImportFeedback, setEmployeeImportFeedback] = useState(null);
  const [expertImportFeedback, setExpertImportFeedback] = useState(null);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [profileOpen, setProfileOpen] = useState(false);

  const loadDashboard = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError("");
    try {
      const companyContext = getCurrentHrCompanyContext();
      const [
        nextEmployees,
        nextExperts,
        nextChallenges,
        nextLiveSessions,
        nextRewards,
      ] = await Promise.all([
        hrApi.getEmployees(companyContext),
        hrApi.getExperts(companyContext),
        hrApi.getChallenges(companyContext),
        hrApi.getLiveSessions(companyContext),
        hrApi.getRewards(companyContext),
      ]);
      setEmployees(nextEmployees || []);
      setExperts(nextExperts || []);
      setChallenges(nextChallenges || []);
      setLiveSessions(nextLiveSessions || []);
      setRewards(nextRewards || []);
      setSelectedChallengeId((current) =>
        nextChallenges?.some((challenge) => challenge.id === current)
          ? current
          : nextChallenges?.[0]?.id || "",
      );
    } catch (loadError) {
      if (!silent)
        setError(loadError.message || "Could not load HR dashboard data.");
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);
  useAutoRefresh(() => loadDashboard(true), "hr-dashboard");

  const selectedChallenge =
    challenges.find((challenge) => challenge.id === selectedChallengeId) ||
    challenges[0];

  const filteredEmployees = useMemo(() => {
    return filterRecords(employees, employeeSearch, [
      "name",
      "department",
      "email",
      "status",
    ]);
  }, [employees, employeeSearch]);

  const filteredExperts = useMemo(() => {
    return filterRecords(experts, expertSearch, [
      "name",
      "specialization",
      "experience",
      "email",
    ]);
  }, [experts, expertSearch]);

  async function addEmployee(event) {
    event.preventDefault();
    if (!canCreateUsers) return;
    const formData = new FormData(event.currentTarget);
    setSaving(true);
    setError("");
    setFormError("");
    try {
      const company = requireHrCompanyContext();
      if (!company)
        throw new Error(
          "Your HR account is not linked to a company. Ask an administrator to assign one before adding employees.",
        );
      const capacity = await getCompanyCapacity(
        "employee",
        company,
        employees.length,
      );
      if (!capacity.allowed) throw new Error(capacity.reason);
      const employee = await hrApi.createEmployee({
        name: formData.get("name").trim(),
        department: formData.get("department"),
        email: formData.get("email").trim(),
        password: formData.get("password"),
        status: "Active",
        companyId: company.companyId,
        companyName: company.companyName,
      });
      setEmployees((current) => [employee, ...current]);
      setActiveModal(null);
    } catch (saveError) {
      setFormError(saveError.message || "Unable to add the employee.");
    } finally {
      setSaving(false);
    }
  }

  async function addExpert(event) {
    event.preventDefault();
    if (!canCreateUsers) return;
    const formData = new FormData(event.currentTarget);
    setSaving(true);
    setError("");
    setFormError("");
    try {
      const company = requireHrCompanyContext();
      if (!company)
        throw new Error(
          "Your HR account is not linked to a company. Ask an administrator to assign one before adding wellness experts.",
        );
      const capacity = await getCompanyCapacity(
        "expert",
        company,
        experts.length,
      );
      if (!capacity.allowed) throw new Error(capacity.reason);
      const expert = await hrApi.createExpert({
        name: formData.get("name").trim(),
        specialization: formData.get("specialization"),
        experience: formData.get("experience").trim(),
        email: formData.get("email").trim(),
        password: formData.get("password"),
        status: "Active",
        companyId: company.companyId,
        companyName: company.companyName,
      });
      setExperts((current) => [expert, ...current]);
      setActiveModal(null);
    } catch (saveError) {
      setFormError(saveError.message || "Unable to add the wellness expert.");
    } finally {
      setSaving(false);
    }
  }

  async function importEmployees(file) {
    await importDirectoryRecords(file, "employee");
  }

  async function importExperts(file) {
    await importDirectoryRecords(file, "expert");
  }

  async function importDirectoryRecords(file, kind) {
    if (!canCreateUsers) return;
    const company = requireHrCompanyContext();
    if (!company) {
      setImportFeedback(
        kind,
        "Your HR account is not linked to a company. Ask an administrator to assign one first.",
        "error",
      );
      return;
    }

    setImporting(kind);
    setImportFeedback(
      kind,
      `Importing ${kind === "employee" ? "employee" : "wellness expert"} spreadsheet…`,
      "success",
    );
    try {
      const rows = await readSpreadsheetRows(file);
      const capacity = await getCompanyCapacity(
        kind,
        company,
        kind === "employee" ? employees.length : experts.length,
      );
      if (!capacity.allowed) throw new Error(capacity.reason);

      let importedCount = 0;
      let skippedCount = 0;
      const failures = [];
      const createdRecords = [];

      for (const [index, row] of rows.entries()) {
        const record =
          kind === "employee"
            ? normalizeImportedEmployee(row)
            : normalizeImportedExpert(row);
        const rowNumber = index + 2;
        if (isEmptyImportedRecord(record)) {
          skippedCount += 1;
          continue;
        }

        const requiredFields =
          kind === "employee"
            ? [
                ["Employee Name", record.name],
                ["Department", record.department],
                ["Gmail Address", record.email],
                ["Password", record.password],
              ]
            : [
                ["Full Name", record.name],
                ["Specialization", record.specialization],
                ["Experience (Years)", record.experience],
                ["Gmail Address", record.email],
                ["Password", record.password],
              ];
        const missingFields = requiredFields
          .filter(([, value]) => !value)
          .map(([label]) => label);
        if (missingFields.length) {
          failures.push(
            `Row ${rowNumber}: missing ${missingFields.join(", ")}.`,
          );
          continue;
        }
        if (
          kind === "employee" &&
          employees.length + importedCount >= capacity.limit
        ) {
          failures.push(
            `Row ${rowNumber}: employee limit reached (${capacity.limit}).`,
          );
          continue;
        }
        if (
          kind === "expert" &&
          experts.length + importedCount >= capacity.limit
        ) {
          failures.push(
            `Row ${rowNumber}: wellness expert limit reached (${capacity.limit}).`,
          );
          continue;
        }

        try {
          const created =
            kind === "employee"
              ? await hrApi.createEmployee({
                  ...record,
                  status: record.status || "Active",
                  companyId: company.companyId,
                  companyName: company.companyName,
                })
              : await hrApi.createExpert({
                  ...record,
                  status: record.status || "Active",
                  companyId: company.companyId,
                  companyName: company.companyName,
                });
          createdRecords.push(created);
          importedCount += 1;
        } catch (createError) {
          failures.push(
            `Row ${rowNumber}: ${createError.message || "Unable to create record."}`,
          );
        }
      }

      if (kind === "employee")
        setEmployees((current) => [...createdRecords, ...current]);
      else setExperts((current) => [...createdRecords, ...current]);

      const summary = [
        `${importedCount} ${kind === "employee" ? "employee" : "wellness expert"}${importedCount === 1 ? "" : "s"} imported successfully.`,
      ];
      if (skippedCount)
        summary.push(
          `${skippedCount} empty row${skippedCount === 1 ? "" : "s"} skipped.`,
        );
      if (failures.length) summary.push(summarizeImportFailures(failures));
      setImportFeedback(
        kind,
        summary.join(" "),
        failures.length && !importedCount ? "error" : "success",
      );
    } catch (importError) {
      setImportFeedback(
        kind,
        importError.message || "Unable to import the spreadsheet.",
        "error",
      );
    } finally {
      setImporting("");
    }
  }

  function setImportFeedback(kind, message, type) {
    const value = { message, type };
    if (kind === "employee") setEmployeeImportFeedback(value);
    else setExpertImportFeedback(value);
  }

  function openAddModal(kind) {
    setFormError("");
    setActiveModal(kind);
  }

  function closeAddModal() {
    setFormError("");
    setActiveModal(null);
  }

  async function deleteEmployee(employeeId) {
    if (!canDeleteUsers) return;
    setError("");
    try {
      await hrApi.deleteEmployee(employeeId);
      setEmployees((current) =>
        current.filter((employee) => employee.id !== employeeId),
      );
    } catch (deleteError) {
      setError(deleteError.message);
    }
  }

  async function deleteExpert(expertId) {
    if (!canDeleteUsers) return;
    setError("");
    try {
      await hrApi.deleteExpert(expertId);
      setExperts((current) =>
        current.filter((expert) => expert.id !== expertId),
      );
    } catch (deleteError) {
      setError(deleteError.message);
    }
  }

  if (!stylesReady) return <RouteLoadingScreen />;

  return (
    <div className="page-shell" id="home">
      <HRNavbar onProfileClick={() => setProfileOpen(true)} />

      {canReadReports && (
        <section className="hero-card">
          <h1>Welcome back</h1>
          <p>
            Monitor and manage employee wellness programs, track participation,
            and ensure a healthy workplace culture.
          </p>
        </section>
      )}

      {error && (
        <p className="api-error" role="alert">
          {error}
        </p>
      )}
      {loading && <p className="api-status">Loading HR workspace…</p>}

      {canReadReports && (
        <section className="stats-grid">
          <HRStatCard
            icon="PG"
            label="Total Employees"
            tone="teal"
            value={employees.length}
          />
          <HRStatCard
            icon="WB"
            label="Wellness Experts"
            tone="blue"
            value={experts.length}
          />
          <HRStatCard
            icon="LS"
            label="Scheduled Live Sessions"
            tone="green"
            value={liveSessions.length}
          />
          <HRStatCard
            icon="RW"
            label="Active Rewards"
            tone="purple"
            value={rewards.length}
          />
          <HRStatCard
            icon="AC"
            label="Active Challenges"
            tone="orange"
            value={challenges.length}
          />
        </section>
      )}

      {canReadChallenges && (
        <HRChallengeOverview
          challenges={challenges}
          onSelectChallenge={setSelectedChallengeId}
          selectedChallenge={selectedChallenge}
        />
      )}

      {canReadUsers && (
        <HREmployeeManagement
          employees={filteredEmployees}
          onAddEmployee={() => openAddModal("employee")}
          onDeleteEmployee={deleteEmployee}
          onImportEmployees={importEmployees}
          importFeedback={employeeImportFeedback}
          importing={importing === "employee"}
          onSearch={setEmployeeSearch}
          searchTerm={employeeSearch}
          canCreate={canCreateUsers}
          canDelete={canDeleteUsers}
        />
      )}

      {canReadUsers && (
        <HRExpertManagement
          experts={filteredExperts}
          onAddExpert={() => openAddModal("expert")}
          onDeleteExpert={deleteExpert}
          onImportExperts={importExperts}
          importFeedback={expertImportFeedback}
          importing={importing === "expert"}
          onSearch={setExpertSearch}
          searchTerm={expertSearch}
          canCreate={canCreateUsers}
          canDelete={canDeleteUsers}
        />
      )}

      <DashboardProfileOverlay
        role="hr"
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
      />

      {canCreateUsers && activeModal === "employee" && (
        <HRModal
          onClose={closeAddModal}
          title="Add Employee to Wellness Program"
        >
          <form className="employee-form" onSubmit={addEmployee}>
            {formError && (
              <p className="import-feedback is-error" role="alert">
                {formError}
              </p>
            )}
            <div className="field-group">
              <label htmlFor="employeeName">Employee Name</label>
              <input
                id="employeeName"
                name="name"
                placeholder="Enter Employee Name"
                required
              />
            </div>
            <div className="field-group">
              <label htmlFor="department">Department</label>
              <div className="select-wrap">
                <select
                  defaultValue=""
                  id="department"
                  name="department"
                  required
                >
                  <option disabled value="">
                    Select Department
                  </option>
                  <option>Engineering</option>
                  <option>Marketing</option>
                  <option>Sales</option>
                  <option>Operations</option>
                  <option>Advertising</option>
                </select>
              </div>
            </div>
            <div className="field-group">
              <label htmlFor="employeeEmail">Gmail Address</label>
              <input
                id="employeeEmail"
                name="email"
                placeholder="Enter Gmail"
                required
                type="email"
              />
            </div>
            <div className="field-group">
              <label htmlFor="employeePassword">Password</label>
              <input
                id="employeePassword"
                minLength="6"
                name="password"
                placeholder="Enter Password"
                required
                type="password"
              />
            </div>
            <div className="form-actions">
              <button className="submit-btn" disabled={saving} type="submit">
                {saving ? "Saving…" : "Add Employee"}
              </button>
              <button
                className="back-btn"
                onClick={closeAddModal}
                type="button"
              >
                Back
              </button>
            </div>
          </form>
        </HRModal>
      )}

      {canCreateUsers && activeModal === "expert" && (
        <HRModal onClose={closeAddModal} title="Add Wellness Expert">
          <form className="expert-form" onSubmit={addExpert}>
            {formError && (
              <p className="import-feedback is-error" role="alert">
                {formError}
              </p>
            )}
            <div className="field-group">
              <label htmlFor="expertName">Full Name</label>
              <input
                id="expertName"
                name="name"
                placeholder="Enter expert name"
                required
              />
            </div>
            <div className="field-group">
              <label htmlFor="expertExperience">Experience (Years)</label>
              <input
                id="expertExperience"
                name="experience"
                placeholder="e.g., 5 years"
                required
              />
            </div>
            <div className="field-group">
              <label htmlFor="expertEmail">Gmail Address</label>
              <input
                id="expertEmail"
                name="email"
                placeholder="Enter Gmail"
                required
                type="email"
              />
            </div>
            <div className="field-group">
              <label htmlFor="expertPassword">Password</label>
              <input
                id="expertPassword"
                minLength="6"
                name="password"
                placeholder="Enter Password"
                required
                type="password"
              />
            </div>
            <div className="field-group">
              <label htmlFor="expertSpecializationPhysical">
                Specialization
              </label>
              <div className="specialization-grid">
                <label className="special-card">
                  <input
                    id="expertSpecializationPhysical"
                    name="specialization"
                    required
                    type="radio"
                    value="Physical Trainer"
                  />
                  <span className="special-card-inner">
                    <i className="fa-solid fa-wave-square" />
                    <strong>Physical Trainer</strong>
                  </span>
                </label>
                <label className="special-card">
                  <input
                    name="specialization"
                    type="radio"
                    value="Nutritionist"
                  />
                  <span className="special-card-inner">
                    <i className="fa-solid fa-stethoscope" />
                    <strong>Nutritionist</strong>
                  </span>
                </label>
                <label className="special-card">
                  <input
                    name="specialization"
                    type="radio"
                    value="Psychologist"
                  />
                  <span className="special-card-inner">
                    <i className="fa-solid fa-brain" />
                    <strong>Psychologist</strong>
                  </span>
                </label>
              </div>
            </div>
            <div className="form-actions">
              <button className="submit-btn" disabled={saving} type="submit">
                {saving ? "Saving…" : "Add Expert"}
              </button>
              <button
                className="back-btn"
                onClick={closeAddModal}
                type="button"
              >
                Back
              </button>
            </div>
          </form>
        </HRModal>
      )}
    </div>
  );
}

function filterRecords(records, searchTerm, fields) {
  const query = searchTerm.trim().toLowerCase();
  if (!query) return records;

  return records.filter((record) =>
    fields.some((field) =>
      String(record[field] || "")
        .toLowerCase()
        .includes(query),
    ),
  );
}

async function getCompanyCapacity(kind, company, currentCount) {
  const subscriptions = await hrApi.getSubscriptions();
  const normalizedCompanyName = company.companyName.trim().toLowerCase();
  const subscription = (subscriptions || []).find(
    (item) =>
      String(item.status || "")
        .trim()
        .toLowerCase() === "active" &&
      (() => {
        const subscriptionCompanyId = String(item.companyId || "").trim();
        if (company.companyId && subscriptionCompanyId) {
          return subscriptionCompanyId === company.companyId;
        }
        return (
          String(item.companyName || "")
            .trim()
            .toLowerCase() === normalizedCompanyName
        );
      })(),
  );
  if (
    !subscription ||
    !["starter", "business", "enterprise"].includes(
      String(subscription.planId || "")
        .trim()
        .toLowerCase(),
    )
  ) {
    return {
      allowed: false,
      reason:
        "No active subscription is attached to this company. Choose a plan from Upgrade Plan before adding users.",
    };
  }
  const planId = String(subscription.planId).trim().toLowerCase();
  const planLimits = {
    starter: { employee: 100, expert: 10 },
    business: { employee: 1000, expert: 50 },
    enterprise: { employee: 10000, expert: 100 },
  };
  const configuredLimit =
    kind === "employee" ? subscription.employeeLimit : subscription.expertLimit;
  const limit = Number(configuredLimit ?? planLimits[planId][kind]);
  if (!Number.isFinite(limit) || limit <= 0) {
    return {
      allowed: false,
      reason:
        "The active subscription plan is invalid. Choose a plan from Upgrade Plan before adding users.",
    };
  }
  if (currentCount >= limit) {
    return {
      allowed: false,
      reason: `${kind === "employee" ? "Employee" : "Wellness expert"} limit reached (${currentCount}/${limit}) on the ${subscription.planName || "current"} plan. Upgrade the plan to add more.`,
    };
  }
  return { allowed: true, limit };
}

export default HRDashboard;
