export function DesktopLoadingShell() {
  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      {/* Sidebar skeleton */}
      <div
        style={{
          width: "64px",
          flexShrink: 0,
          backgroundColor: "#1e2535",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          paddingTop: "16px",
          gap: "8px",
        }}
      >
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "8px",
              backgroundColor: "rgba(255,255,255,0.08)",
            }}
          />
        ))}
      </div>
      {/* Main area spinner */}
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#f8fafc",
        }}
      >
        <div
          style={{
            width: "32px",
            height: "32px",
            borderRadius: "50%",
            border: "3px solid #e2e8f0",
            borderTopColor: "#2196F3",
            animation: "spin 0.8s linear infinite",
          }}
        />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
}
