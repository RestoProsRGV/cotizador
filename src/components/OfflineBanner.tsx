import { useEffect, useState } from "react";

/**
 * Displays a yellow banner when the browser is offline.
 * Listens to window online/offline events. Does not block the app.
 */
export function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    function handleOffline() { setIsOffline(true); }
    function handleOnline()  { setIsOffline(false); }

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online",  handleOnline);
    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online",  handleOnline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        backgroundColor: "#fef3c7",
        borderBottom: "1px solid #f59e0b",
        padding: "8px 16px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "6px",
        fontSize: "13px",
        fontWeight: 500,
        color: "#92400e",
      }}
    >
      ⚠️ No internet connection — showing cached data
    </div>
  );
}
