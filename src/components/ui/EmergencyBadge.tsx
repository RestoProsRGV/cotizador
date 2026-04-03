import { TriangleAlert } from "lucide-react";

interface EmergencyBadgeProps {
  title: string;
  detail: string;
}

export function EmergencyBadge({ title, detail }: EmergencyBadgeProps) {
  return (
    <div
      className="flex items-start gap-3 border px-4 py-3"
      style={{
        borderRadius: "4px",
        backgroundColor: "#FFFBEB",
        borderColor: "var(--color-emergency)",
        borderWidth: "1.5px",
      }}
      role="status"
      aria-live="polite"
    >
      <TriangleAlert
        className="mt-0.5 shrink-0"
        size={18}
        style={{ color: "var(--color-emergency)" }}
        aria-hidden
      />
      <div>
        <p className="text-sm font-semibold" style={{ color: "#92400E" }}>
          {title}
        </p>
        <p className="text-xs mt-0.5" style={{ color: "#92400E", opacity: 0.85 }}>
          {detail}
        </p>
      </div>
    </div>
  );
}
