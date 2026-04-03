import { TriangleAlert } from "lucide-react";

interface EmergencyBadgeProps {
  title: string;
  detail: string;
}

export function EmergencyBadge({ title, detail }: EmergencyBadgeProps) {
  return (
    <div
      className="flex items-start gap-3 rounded-lg border-2 px-4 py-3"
      style={{
        backgroundColor: "#fffbeb",
        borderColor: "var(--color-warning)",
      }}
      role="status"
      aria-live="polite"
    >
      <TriangleAlert
        className="mt-0.5 shrink-0"
        size={20}
        style={{ color: "var(--color-warning)" }}
        aria-hidden
      />
      <div>
        <p className="text-sm font-semibold" style={{ color: "#92400e" }}>
          {title}
        </p>
        <p className="text-sm" style={{ color: "#92400e", opacity: 0.85 }}>
          {detail}
        </p>
      </div>
    </div>
  );
}
