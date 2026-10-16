import { useRef } from "react";

function HREmployeeManagement({
  employees,
  onAddEmployee,
  onDeleteEmployee,
  onImportEmployees,
  importFeedback,
  importing,
  onSearch,
  searchTerm,
  canCreate = true,
  canDelete = true,
}) {
  const fileInputRef = useRef(null);

  return (
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
                  if (file) onImportEmployees(file);
                  event.target.value = "";
                }}
                ref={fileInputRef}
                type="file"
              />
              <button
                className="primary-button"
                onClick={onAddEmployee}
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
        <div className="search-bar">
          <input
            onChange={(event) => onSearch(event.target.value)}
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
              {employees.length ? (
                employees.map((employee) => (
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
                        className={`status-pill ${employee.status.toLowerCase()}`}
                      >
                        {employee.status}
                      </span>
                    </td>
                    <td className="action-cell">
                      <a href={`mailto:${employee.email}`}>Contact</a>
                      {canDelete && (
                        <button
                          className="delete-icon"
                          onClick={() => onDeleteEmployee(employee.id)}
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
  );
}

function getInitials(name) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");
}

export default HREmployeeManagement;
