import { DesktopSidebar } from "@/components/desktop/DesktopSidebar";
import { DesktopHeader, type Breadcrumb } from "@/components/desktop/DesktopHeader";

interface DesktopShellProps {
  children: React.ReactNode;
  breadcrumbs?: Breadcrumb[];
}

export function DesktopShell({ children, breadcrumbs = [] }: DesktopShellProps) {
  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "#f9fafb" }}>
      <DesktopSidebar />
      {/* Main area — offset by sidebar width */}
      <div
        style={{
          marginLeft: "64px",
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minHeight: "100vh",
        }}
      >
        <DesktopHeader breadcrumbs={breadcrumbs} />
        <main style={{ flex: 1, overflowY: "auto" }}>{children}</main>
      </div>
    </div>
  );
}
