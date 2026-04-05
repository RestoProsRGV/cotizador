/** Full-screen error state shown when the app crashes via Sentry.ErrorBoundary. */
export function AppErrorFallback() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        backgroundColor: "var(--color-background)",
        padding: "32px 24px",
        textAlign: "center",
      }}
    >
      {/* RestoPros logo mark */}
      <div
        style={{
          width: "64px",
          height: "64px",
          borderRadius: "50%",
          backgroundColor: "#2196F3",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: "24px",
        }}
      >
        <span
          style={{
            color: "#ffffff",
            fontWeight: 700,
            fontSize: "20px",
            letterSpacing: "-0.02em",
          }}
        >
          RP
        </span>
      </div>

      <h1
        style={{
          fontSize: "20px",
          fontWeight: 600,
          color: "var(--color-text-primary)",
          marginBottom: "8px",
        }}
      >
        Something went wrong
      </h1>

      <p
        style={{
          fontSize: "15px",
          color: "var(--color-text-secondary)",
          marginBottom: "32px",
          maxWidth: "280px",
          lineHeight: 1.5,
        }}
      >
        Our team has been notified. Please reload the app to continue.
      </p>

      <button
        type="button"
        onClick={() => window.location.reload()}
        style={{
          backgroundColor: "#2196F3",
          color: "#ffffff",
          border: "none",
          borderRadius: "4px",
          padding: "0 24px",
          height: "48px",
          fontSize: "16px",
          fontWeight: 600,
          cursor: "pointer",
        }}
      >
        Reload App
      </button>
    </div>
  );
}
