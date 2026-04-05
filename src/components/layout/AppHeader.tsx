import { type ReactNode } from "react";
import { ChevronLeft } from "lucide-react";

export interface StatusBadge {
  label: string;
  /** Dot + text color */
  color: "gray" | "green" | "blue";
}

const STATUS_BADGE_COLORS: Record<StatusBadge["color"], { dot: string; text: string }> = {
  gray:  { dot: "#9ca3af", text: "#6b7280" },
  green: { dot: "#10b981", text: "#065f46" },
  blue:  { dot: "#2196F3", text: "#1e40af" },
};

interface AppHeaderProps {
  title: string;
  onBack?: () => void;
  /** Icon buttons rendered on the right side */
  actions?: ReactNode;
  /** Optional status indicator shown below the title */
  statusBadge?: StatusBadge;
}

/**
 * Primary app header — blue top bar used across all screens.
 * Matches Encircle's flat blue header pattern.
 */
export function AppHeader({ title, onBack, actions, statusBadge }: AppHeaderProps) {
  const badgeColors = statusBadge ? STATUS_BADGE_COLORS[statusBadge.color] : null;

  return (
    <header
      className="flex items-center justify-between sticky top-0 z-20 w-full"
      style={{
        height: statusBadge ? "64px" : "56px",
        backgroundColor: "var(--color-header-primary)",
        paddingLeft: onBack ? "4px" : "16px",
        paddingRight: actions ? "4px" : "16px",
      }}
    >
      {/* Left: back button or spacer */}
      <div style={{ width: "48px", flexShrink: 0 }}>
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="flex items-center justify-center"
            style={{
              width: "48px",
              height: "48px",
              color: "var(--color-text-on-primary)",
              background: "transparent",
              border: "none",
              cursor: "pointer",
            }}
            aria-label="Go back"
          >
            <ChevronLeft size={26} aria-hidden />
          </button>
        )}
      </div>

      {/* Center: title + optional status badge */}
      <div className="flex-1 flex flex-col items-center justify-center">
        <h1
          className="text-center font-semibold truncate w-full"
          style={{
            fontSize: "18px",
            color: "var(--color-text-on-primary)",
            letterSpacing: "-0.01em",
          }}
        >
          {title}
        </h1>
        {statusBadge && badgeColors && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              marginTop: "2px",
            }}
          >
            <span
              aria-hidden
              style={{
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                backgroundColor: badgeColors.dot,
                flexShrink: 0,
              }}
            />
            <span
              style={{
                fontSize: "11px",
                fontWeight: 500,
                color: "rgba(255,255,255,0.75)",
                letterSpacing: "0.02em",
              }}
            >
              {statusBadge.label}
            </span>
          </div>
        )}
      </div>

      {/* Right: actions or spacer */}
      <div className="flex items-center justify-end" style={{ width: "48px", flexShrink: 0 }}>
        {actions}
      </div>
    </header>
  );
}
