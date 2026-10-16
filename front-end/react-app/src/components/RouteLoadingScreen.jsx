const screenStyle = {
  position: "fixed",
  inset: 0,
  zIndex: 2147483000,
  display: "grid",
  placeItems: "center",
  background: "linear-gradient(145deg, #eef8fb 0%, #e5f0fc 55%, #e4f7f5 100%)",
  color: "#17243a",
  fontFamily: "Inter, system-ui, sans-serif",
};

const contentStyle = {
  display: "grid",
  justifyItems: "center",
  gap: 12,
  padding: 32,
  textAlign: "center",
};

const spinnerStyle = {
  width: 38,
  height: 38,
  border: "4px solid rgba(15, 165, 158, 0.2)",
  borderTopColor: "#0fa59e",
  borderRadius: "50%",
  animation: "route-style-spin 0.8s linear infinite",
};

export default function RouteLoadingScreen() {
  return (
    <div role="status" aria-live="polite" aria-label="Preparing your page" style={screenStyle}>
      <style>{"@keyframes route-style-spin { to { transform: rotate(360deg); } }"}</style>
      <div style={contentStyle}>
        <span aria-hidden="true" style={spinnerStyle} />
        <strong style={{ fontSize: 18, letterSpacing: "0.01em" }}>Stack Builders</strong>
        <span style={{ color: "#64748b", fontSize: 14 }}>Preparing your workspace…</span>
      </div>
    </div>
  );
}
