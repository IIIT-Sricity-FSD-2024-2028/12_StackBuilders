function SupervisorBarChart({ values, labels, color = "teal" }) {
  const max = Math.max(...values, 1);
  return (
    <div className={`supervisor-bar-chart chart-${color}`} role="img" aria-label="Bar chart">
      {values.map((value, index) => (
        <div className="bar-column" key={`${labels[index]}-${value}`}>
          <span className="bar-value">{value}</span>
          <div className="bar-track"><span style={{ height: `${Math.max(6, (value / max) * 100)}%` }} /></div>
          <small>{labels[index]}</small>
        </div>
      ))}
    </div>
  );
}

function SupervisorLineChart({ values = [], labels = [] }) {
  const width = 640;
  const height = 220;
  const max = Math.max(...values, 1);
  const points = values.map((value, index) => {
    const x = values.length > 1 ? (index / (values.length - 1)) * width : width / 2;
    const y = 200 - (value / max) * 160;
    return [x, y];
  });
  const linePath = points.map(([x, y], index) => `${index ? "L" : "M"}${x} ${y}`).join(" ");
  const areaPath = `${linePath} L ${width} ${height} L 0 ${height} Z`;
  return (
    <div className="supervisor-line-chart" role="img" aria-label="Monthly user growth chart">
      <svg viewBox="0 0 640 220" preserveAspectRatio="none">
        <defs>
          <linearGradient id="supervisor-line-fill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#0fa7a0" stopOpacity=".28" />
            <stop offset="1" stopColor="#0fa7a0" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path className="chart-grid-line" d="M0 40H640M0 95H640M0 150H640M0 205H640" />
        <path className="chart-area" d={areaPath} />
        <path className="chart-line" d={linePath} />
        {points.map(([x, y]) => <circle key={`${x}-${y}`} cx={x} cy={y} r="4" />)}
      </svg>
      <div className="chart-axis-labels">{labels.map((label) => <span key={label}>{label}</span>)}</div>
    </div>
  );
}

function SupervisorDonutChart({ values, labels }) {
  const total = values.reduce((sum, value) => sum + value, 0) || 1;
  const first = (values[0] / total) * 360;
  const second = first + (values[1] / total) * 360;
  return (
    <div className="donut-layout">
      <div className="donut" style={{ background: `conic-gradient(#0fa7a0 0deg ${first}deg, #5e83d6 ${first}deg ${second}deg, #f2a36f ${second}deg 360deg)` }}>
        <div><strong>{total}</strong><span>accounts</span></div>
      </div>
      <div className="chart-legend">
        {labels.map((label, index) => <div key={label}><span className={`legend-dot legend-${index}`} /><span>{label}</span><strong>{values[index]}</strong></div>)}
      </div>
    </div>
  );
}

export { SupervisorBarChart, SupervisorLineChart, SupervisorDonutChart };
