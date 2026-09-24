const paths = {
  chart: "M4 19V5M4 19h17M8 16v-4M12 16V8M16 16v-6M20 16v-9",
  database: "M4 5c0-1.1 3.6-2 8-2s8 .9 8 2-3.6 2-8 2-8-.9-8-2Zm0 0v7c0 1.1 3.6 2 8 2s8-.9 8-2V5",
  file: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Zm0 0v6h6 M8 14h4 M8 18h8",
  layer: "m12 3 9 5-9 5-9-5 9-5Zm-9 9 9 5 9-5M3 16l9 5 9-5",
  plus: "M12 5v14M5 12h14",
  shield: "M12 3 20 6v5c0 5-3.4 8.4-8 10-4.6-1.6-8-5-8-10V6l8-3Z",
  users: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8",
};

function AdminIcon({ name = "chart", size = 20 }) {
  return (
    <svg className="admin-icon" viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" focusable="false">
      <path d={paths[name] || paths.chart} />
    </svg>
  );
}

export default AdminIcon;
