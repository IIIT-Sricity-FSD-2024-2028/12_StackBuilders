import { useMemo, useState } from "react";
import "../admin-company-management.css";

const sampleCompanies = [
  { id: "CMP-001", name: "Greenfield Labs", industry: "Technology", members: 248, status: "Active" },
  { id: "CMP-002", name: "Northstar Health", industry: "Healthcare", members: 124, status: "Active" },
  { id: "CMP-003", name: "Brightpath Finance", industry: "Finance", members: 86, status: "Pending" },
  { id: "CMP-004", name: "Orbit Learning", industry: "Education", members: 52, status: "Inactive" },
];

function CompanyManagement() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("All statuses");

  const filteredCompanies = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return sampleCompanies.filter((company) => {
      const matchesStatus = status === "All statuses" || company.status === status;
      const matchesQuery = !normalizedQuery || `${company.name} ${company.industry} ${company.id}`.toLowerCase().includes(normalizedQuery);
      return matchesStatus && matchesQuery;
    });
  }, [query, status]);

  return (
    <main className="admin-company-page">
      <header className="admin-company-heading">
        <div>
          <p className="admin-eyebrow">Organization Directory</p>
          <h1>Company Management</h1>
          <p>Review company workspaces, membership, and account status from one place.</p>
        </div>
        <button className="admin-primary-button" type="button">+ Add Company</button>
      </header>

      <section className="admin-company-summary" aria-label="Company summary">
        <div><strong>{sampleCompanies.length}</strong><span>Total companies</span></div>
        <div><strong>{sampleCompanies.filter((company) => company.status === "Active").length}</strong><span>Active workspaces</span></div>
        <div><strong>{sampleCompanies.reduce((total, company) => total + company.members, 0)}</strong><span>Total members</span></div>
      </section>

      <section className="admin-company-panel">
        <div className="admin-company-toolbar">
          <label className="admin-search-field">
            <span aria-hidden="true">⌕</span>
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search companies" aria-label="Search companies" />
          </label>
          <select value={status} onChange={(event) => setStatus(event.target.value)} aria-label="Filter by status">
            <option>All statuses</option>
            <option>Active</option>
            <option>Pending</option>
            <option>Inactive</option>
          </select>
          <span className="admin-company-count">{filteredCompanies.length} shown</span>
        </div>

        <div className="admin-company-table-wrap">
          <table className="admin-company-table">
            <thead><tr><th>Company</th><th>Industry</th><th>Members</th><th>Status</th><th>Company ID</th></tr></thead>
            <tbody>
              {filteredCompanies.length === 0 ? (
                <tr><td colSpan="5" className="admin-table-empty">No companies match your filters.</td></tr>
              ) : filteredCompanies.map((company) => (
                <tr key={company.id}>
                  <td><strong>{company.name}</strong></td>
                  <td>{company.industry}</td>
                  <td>{company.members}</td>
                  <td><span className={`admin-status-pill admin-status-${company.status.toLowerCase()}`}>{company.status}</span></td>
                  <td>{company.id}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

export default CompanyManagement;
