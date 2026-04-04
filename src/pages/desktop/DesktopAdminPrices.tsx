import { DesktopSidebar } from "@/components/desktop/DesktopSidebar";
import { AdminPrices } from "@/screens/admin/AdminPrices";

/**
 * Desktop wrapper for AdminPrices.
 * Adds the desktop sidebar without a second header — AdminPrices renders its own AppHeader.
 */
export function DesktopAdminPrices() {
  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "#f9fafb" }}>
      <DesktopSidebar />
      <div style={{ marginLeft: "64px", flex: 1 }}>
        <AdminPrices />
      </div>
    </div>
  );
}
