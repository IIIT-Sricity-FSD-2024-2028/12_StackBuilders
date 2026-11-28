import { useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRoleAccess } from "../../shared/roleAccessContext.jsx";
import HRModal from "./HRModal.jsx";
import {
  clearHrEmployeesError,
  createHrEmployee,
  loadHrEmployees,
  removeHrEmployee,
} from "../employeesSlice.js";
import { checkHrCapacity } from "../subscriptionsSlice.js";
import {
  filterHrRecords,
  getHrCompanyContext,
  hasHrCompanyContext,
  importHrDirectoryRecords,
} from "../hrUtils.js";

function HREmployeeManagement() {
  const { hasPermission } = useRoleAccess();
  const canCreate = hasPermission("user-management-create");
  const canDelete = hasPermission("user-management-delete");
  const dispatch = useDispatch();
  const profile = useSelector((state) => state.auth.session?.profile || null);
  const employees = useSelector((state) => state.hr.employees.items);
  const employeesError = useSelector((state) => state.hr.employees.error);
  const saving = useSelector(
    (state) =>
      state.hr.employees.saving || state.hr.subscriptions.capacityChecking,
  );
  const removing = useSelector((state) => state.hr.employees.removing);
  const company = useMemo(() => getHrCompanyContext(profile), [profile]);
  const [searchTerm, setSearchTerm] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importFeedback, setImportFeedback] = useState(null);
  const [formError, setFormError] = useState("");
  const [actionError, setActionError] = useState("");
  const fileInputRef = useRef(null);

  const filteredEmployees = useMemo(
    () =>
      filterHrRecords(employees, searchTerm, [
        "name",
        "department",
        "email",
        "status",
      ]),
    [employees, searchTerm],
  );

  function openAddModal() {
    setFormError("");
    setActionError("");
    dispatch(clearHrEmployeesError());
    setModalOpen(true);
  }

  function closeAddModal() {
    setFormError("");
    setModalOpen(false);
  }

  async function addEmployee(event) {
    event.preventDefault();
    if (!canCreate) return;
    const formData = new FormData(event.currentTarget);
    setActionError("");
    setFormError("");
    dispatch(clearHrEmployeesError());
    try {
      if (!hasHrCompanyContext(company)) {
        throw new Error(
          "Your HR account is not linked to a company. Ask an administrator to assign one before adding employees.",
        );
      }
      const capacity = await dispatch(
        checkHrCapacity({
          kind: "employee",
          company,
          currentCount: employees.length,
        }),
      ).unwrap();
      if (!capacity.allowed) throw new Error(capacity.reason);
      await dispatch(
        createHrEmployee({
          name: String(formData.get("name") || "").trim(),
          department: formData.get("department"),
          email: String(formData.get("email") || "").trim(),
          password: formData.get("password"),
          status: "Active",
          companyId: company.companyId,
          companyName: company.companyName,
        }),
      ).unwrap();
      setModalOpen(false);
    } catch (saveError) {
      setFormError(saveError.message || "Unable to add the employee.");
    }
  }

  async function deleteEmployee(employeeId) {
    if (!canDelete) return;
    setActionError("");
    dispatch(clearHrEmployeesError());
    try {
      await dispatch(removeHrEmployee(employeeId)).unwrap();
    } catch (deleteError) {
      setActionError(deleteError.message || "Could not remove employee.");
    }
  }

  async function importEmployees(file) {
    if (!canCreate) return;
    setActionError("");
    dispatch(clearHrEmployeesError());
    setImporting(true);
    const result = await importHrDirectoryRecords({
      kind: "employee",
      file,
      company,
      currentCount: employees.length,
      checkCapacity: () =>
        dispatch(
          checkHrCapacity({
            kind: "employee",
            company,
            currentCount: employees.length,
          }),
        ).unwrap(),
      createRecord: (payload) => dispatch(createHrEmployee(payload)).unwrap(),
      onProgress: setImportFeedback,
    });
    setImportFeedback(result);
    setImporting(false);
  }

  return (
    <>
      <section className="section-block">
        <div className="section-header">
          <div>
            <h3>Employee Management Overview</h3>
            <p>Monitor employee wellness metric and program participation.</p>
          </div>
          <div className="section-actions">
            {canCreate && (
              <>
                <button
                  className="import-button"
                  disabled={importing}
                  onClick={() => fileInputRef.current?.click()}
                  type="button"
                >
                  {importing ? "Importing…" : "Import Excel"}
                </button>
                <input
                  accept=".xlsx,.xls,.csv"
                  hidden
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) importEmployees(file);
                    event.target.value = "";
                  }}
                  ref={fileInputRef}
                  type="file"
                />
                <button
                  className="primary-button"
                  onClick={openAddModal}
                  type="button"
                >
                  Add Employee
                </button>
              </>
            )}
          </div>
        </div>

        <div className="panel wide-panel">
          <div className="import-note">
            Upload the first sheet of an Excel or CSV file with columns like{" "}
            <strong>Employee Name</strong>, <strong>Department</strong>,{" "}
            <strong>Gmail Address</strong>, and <strong>Password</strong>.
          </div>
          {importFeedback && (
            <p
              className={`import-feedback ${importFeedback.type === "error" ? "is-error" : "is-success"}`}
            >
              {importFeedback.message}
            </p>
          )}
          {(actionError || employeesError) && (
            <p className="import-feedback is-error" role="alert">
              {actionError || employeesError}{" "}
              {employeesError && (
                <button
                  className="back-btn"
                  onClick={() => dispatch(loadHrEmployees(company))}
                  type="button"
                >
                  Retry
                </button>
              )}
            </p>
          )}
          <div className="search-bar">
            <input
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search employees or reports..."
              type="search"
              value={searchTerm}
            />
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Department / Role</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.length ? (
                  filteredEmployees.map((employee) => (
                    <tr key={employee.id}>
                      <td>
                        <div className="employee-cell">
                          <span className="person-badge employee-badge">
                            {getInitials(employee.name)}
                          </span>
                          <span>{employee.name}</span>
                        </div>
                      </td>
                      <td>{employee.department || "General"}</td>
                      <td>
                        <span
                          className={`status-pill ${(employee.status || "Active").toLowerCase()}`}
                        >
                          {employee.status || "Active"}
                        </span>
                      </td>
                      <td className="action-cell">
                        <a href={`mailto:${employee.email}`}>Contact</a>
                        {canDelete && (
                          <button
                            className="delete-icon"
                            disabled={removing}
                            onClick={() => deleteEmployee(employee.id)}
                            aria-label={`Delete ${employee.name}`}
                            title={`Delete ${employee.name}`}
                            type="button"
                          >
                            <i
                              className="fa-regular fa-trash-can"
                              aria-hidden="true"
                            />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="empty-row-cell" colSpan="4">
                      <div className="empty-state">
                        No employees match your search right now.
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {canCreate && modalOpen && (
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
    </>
  );
}

function getInitials(name = "") {
  return String(name)
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");
}

export default HREmployeeManagement;
