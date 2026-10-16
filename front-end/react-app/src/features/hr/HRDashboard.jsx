import { useMemo, useState } from "react";
import HRChallengeOverview from "./components/HRChallengeOverview.jsx";
import HREmployeeManagement from "./components/HREmployeeManagement.jsx";
import HRExpertManagement from "./components/HRExpertManagement.jsx";
import HRModal from "./components/HRModal.jsx";
import HRNavbar from "./components/HRNavbar.jsx";
import HRStatCard from "./components/HRStatCard.jsx";
import "./hr-dashboard.css";

const employeeSeed = [
  {
    id: "emp-1",
    name: "Ananya Rao",
    department: "Engineering",
    email: "ananya.rao@stackbuilders.com",
    status: "Active",
  },
  {
    id: "emp-2",
    name: "Rahul Menon",
    department: "Marketing",
    email: "rahul.menon@stackbuilders.com",
    status: "Active",
  },
  {
    id: "emp-3",
    name: "Meera Iyer",
    department: "Operations",
    email: "meera.iyer@stackbuilders.com",
    status: "Inactive",
  },
];

const expertSeed = [
  {
    id: "expert-1",
    name: "Dr. Kavya Nair",
    specialization: "Nutritionist",
    experience: "6 years",
    email: "kavya.nair@stackbuilders.com",
  },
  {
    id: "expert-2",
    name: "Arjun Shetty",
    specialization: "Physical Trainer",
    experience: "4 years",
    email: "arjun.shetty@stackbuilders.com",
  },
  {
    id: "expert-3",
    name: "Dr. Sana Khan",
    specialization: "Psychologist",
    experience: "8 years",
    email: "sana.khan@stackbuilders.com",
  },
];

const challengeSeed = [
  {
    id: "challenge-1",
    name: "10K Steps Sprint",
    type: "Fitness",
    goal: "Walk 10,000 steps daily",
    reward: "Wellness points",
    deadline: "30 Sep 2026",
  },
  {
    id: "challenge-2",
    name: "Hydration Habit",
    type: "Health",
    goal: "Drink 3 liters of water",
    reward: "Healthy snack box",
    deadline: "5 Oct 2026",
  },
  {
    id: "challenge-3",
    name: "Mindful Minutes",
    type: "Wellness",
    goal: "Meditate 10 minutes daily",
    reward: "Mindfulness badge",
    deadline: "12 Oct 2026",
  },
];

function HRDashboard() {
  const [employees, setEmployees] = useStoredRecords(
    "stackbuilders.react.hr.employees",
    employeeSeed
  );
  const [experts, setExperts] = useStoredRecords("stackbuilders.react.hr.experts", expertSeed);
  const [challenges] = useStoredRecords("stackbuilders.react.hr.challenges", challengeSeed);
  const [employeeSearch, setEmployeeSearch] = useState("");
  const [expertSearch, setExpertSearch] = useState("");
  const [selectedChallengeId, setSelectedChallengeId] = useState(challenges[0]?.id || "");
  const [activeModal, setActiveModal] = useState(null);

  const selectedChallenge =
    challenges.find((challenge) => challenge.id === selectedChallengeId) || challenges[0];

  const filteredEmployees = useMemo(() => {
    return filterRecords(employees, employeeSearch, ["name", "department", "email", "status"]);
  }, [employees, employeeSearch]);

  const filteredExperts = useMemo(() => {
    return filterRecords(experts, expertSearch, [
      "name",
      "specialization",
      "experience",
      "email",
    ]);
  }, [experts, expertSearch]);

  function addEmployee(event) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setEmployees([
      {
        id: createId("emp"),
        name: formData.get("name").trim(),
        department: formData.get("department"),
        email: formData.get("email").trim(),
        status: "Active",
      },
      ...employees,
    ]);
    setActiveModal(null);
  }

  function addExpert(event) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setExperts([
      {
        id: createId("expert"),
        name: formData.get("name").trim(),
        specialization: formData.get("specialization"),
        experience: formData.get("experience").trim(),
        email: formData.get("email").trim(),
      },
      ...experts,
    ]);
    setActiveModal(null);
  }

  return (
    <div className="hr-page-shell" id="home">
      <HRNavbar />

      <section className="hr-hero-card">
        <h1>Welcome back</h1>
        <p>
          Monitor and manage employee wellness programs, track participation, and ensure a
          healthy workplace culture.
        </p>
      </section>

      <section className="hr-stats-grid">
        <HRStatCard icon="PG" label="Total Employees" tone="teal" value={employees.length} />
        <HRStatCard icon="WB" label="Wellness Experts" tone="blue" value={experts.length} />
        <HRStatCard icon="LS" label="Scheduled Live Sessions" tone="green" value="4" />
        <HRStatCard icon="RW" label="Active Rewards" tone="purple" value="3" />
        <HRStatCard icon="AC" label="Active Challenges" tone="orange" value={challenges.length} />
      </section>

      <HRChallengeOverview
        challenges={challenges}
        onSelectChallenge={setSelectedChallengeId}
        selectedChallenge={selectedChallenge}
      />

      <HREmployeeManagement
        employees={filteredEmployees}
        onAddEmployee={() => setActiveModal("employee")}
        onDeleteEmployee={(employeeId) =>
          setEmployees(employees.filter((employee) => employee.id !== employeeId))
        }
        onSearch={setEmployeeSearch}
        searchTerm={employeeSearch}
      />

      <HRExpertManagement
        experts={filteredExperts}
        onAddExpert={() => setActiveModal("expert")}
        onDeleteExpert={(expertId) => setExperts(experts.filter((expert) => expert.id !== expertId))}
        onSearch={setExpertSearch}
        searchTerm={expertSearch}
      />

      <footer className="hr-footer">
        <div className="hr-footer-links">
          <a href="#about">About us</a>
          <span>•</span>
          <a href="#contact">Contact us</a>
        </div>
        <p>© 2026 StackBuilders. Built with wellness in mind.</p>
      </footer>

      {activeModal === "employee" && (
        <HRModal onClose={() => setActiveModal(null)} title="Add Employee to Wellness Program">
          <form className="hr-employee-form" onSubmit={addEmployee}>
            <div className="hr-field-group">
              <label htmlFor="employeeName">Employee Name</label>
              <input id="employeeName" name="name" placeholder="Enter Employee Name" required />
            </div>
            <div className="hr-field-group">
              <label htmlFor="department">Department</label>
              <div className="hr-select-wrap">
                <select defaultValue="" id="department" name="department" required>
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
            <div className="hr-field-group">
              <label htmlFor="employeeEmail">Gmail Address</label>
              <input id="employeeEmail" name="email" placeholder="Enter Gmail" required type="email" />
            </div>
            <div className="hr-field-group">
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
            <div className="hr-form-actions">
              <button className="hr-submit-btn" type="submit">
                Add Employee
              </button>
              <button className="hr-back-btn" onClick={() => setActiveModal(null)} type="button">
                Back
              </button>
            </div>
          </form>
        </HRModal>
      )}

      {activeModal === "expert" && (
        <HRModal onClose={() => setActiveModal(null)} title="Add Wellness Expert">
          <form className="hr-expert-form" onSubmit={addExpert}>
            <div className="hr-field-group">
              <label htmlFor="expertName">Full Name</label>
              <input id="expertName" name="name" placeholder="Enter expert name" required />
            </div>
            <div className="hr-field-group">
              <label htmlFor="expertExperience">Experience (Years)</label>
              <input
                id="expertExperience"
                name="experience"
                placeholder="e.g., 5 years"
                required
              />
            </div>
            <div className="hr-field-group">
              <label htmlFor="expertEmail">Gmail Address</label>
              <input id="expertEmail" name="email" placeholder="Enter Gmail" required type="email" />
            </div>
            <div className="hr-field-group">
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
            <div className="hr-field-group">
              <label htmlFor="specialization">Specialization</label>
              <div className="hr-select-wrap">
                <select defaultValue="Nutritionist" id="specialization" name="specialization">
                  <option>Physical Trainer</option>
                  <option>Nutritionist</option>
                  <option>Psychologist</option>
                </select>
              </div>
            </div>
            <div className="hr-form-actions">
              <button className="hr-submit-btn" type="submit">
                Add Expert
              </button>
              <button className="hr-back-btn" onClick={() => setActiveModal(null)} type="button">
                Back
              </button>
            </div>
          </form>
        </HRModal>
      )}
    </div>
  );
}

function useStoredRecords(key, fallback) {
  const [records, setRecords] = useState(() => {
    try {
      const stored = window.localStorage.getItem(key);
      return stored ? JSON.parse(stored) : fallback;
    } catch {
      return fallback;
    }
  });

  function updateRecords(nextRecords) {
    setRecords(nextRecords);
    window.localStorage.setItem(key, JSON.stringify(nextRecords));
  }

  return [records, updateRecords];
}

function filterRecords(records, searchTerm, fields) {
  const query = searchTerm.trim().toLowerCase();
  if (!query) return records;

  return records.filter((record) =>
    fields.some((field) => String(record[field] || "").toLowerCase().includes(query))
  );
}

function createId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export default HRDashboard;
