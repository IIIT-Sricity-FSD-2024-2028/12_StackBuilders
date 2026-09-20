function SupervisorTable({ columns, rows, emptyMessage = "No records found.", rowKey }) {
  return (
    <div className="supervisor-table-wrap">
      <table className="supervisor-table">
        <thead><tr>{columns.map((column) => <th key={column.key}>{column.label}</th>)}</tr></thead>
        <tbody>
          {rows.length === 0 ? (
            <tr><td className="table-empty" colSpan={columns.length}>{emptyMessage}</td></tr>
          ) : rows.map((row, index) => <tr key={rowKey ? rowKey(row) : row.id || index}>{columns.map((column) => <td key={column.key}>{column.render ? column.render(row) : row[column.key]}</td>)}</tr>)}
        </tbody>
      </table>
    </div>
  );
}

export default SupervisorTable;
