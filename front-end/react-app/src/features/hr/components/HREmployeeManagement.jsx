function HREmployeeManagement({
  employees,
  onAddEmployee,
  onDeleteEmployee,
  onSearch,
  searchTerm,
}) {
  return (
    <section className="hr-section-block">
      <div className="hr-section-header">
        <div>
          <h3>Employee Management Overview</h3>
          <p>Monitor employee wellness metric and program participation.</p>
        </div>
        <div className="hr-section-actions">
          <button className="hr-import-button" type="button">
            Import Excel
          </button>
          <button className="hr-primary-button" onClick={onAddEmployee} type="button">
            Add Employee
          </button>
        </div>
      </div>

      <div className="hr-panel hr-wide-panel">
        <div className="hr-import-note">
          Upload the first sheet of an Excel or CSV file with columns like{" "}
          <strong>Employee Name</strong>, <strong>Department</strong>,{" "}
          <strong>Gmail Address</strong>, and <strong>Password</strong>.
        </div>
        <div className="hr-search-bar">
          <input
            onChange={(event) => onSearch(event.target.value)}
            placeholder="Search employees or reports..."
            type="search"
            value={searchTerm}
          />
        </div>

        <div className="hr-table-wrap">
          <table className="hr-table">
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
                      <div className="hr-employee-cell">
                        <span className="hr-person-badge hr-employee-badge">
                          {getInitials(employee.name)}
                        </span>
                        <span>{employee.name}</span>
                      </div>
                    </td>
                    <td>{employee.department || "General"}</td>
                    <td>
                      <span className={`hr-status-pill ${employee.status.toLowerCase()}`}>
                        {employee.status}
                      </span>
                    </td>
                    <td className="hr-action-cell">
                      <a href={`mailto:${employee.email}`}>Contact</a>
                      <button
                        className="hr-delete-icon"
                        onClick={() => onDeleteEmployee(employee.id)}
                        type="button"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="hr-empty-row-cell" colSpan="4">
                    <div className="hr-empty-state">No employees match your search right now.</div>
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
