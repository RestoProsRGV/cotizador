import { type ReactNode } from "react";
import { ChevronLeft } from "lucide-react";

interface AppHeaderProps {
  title: string;
  onBack?: () => void;
  /** Icon buttons rendered on the right side */
  actions?: ReactNode;
}

/**
 * Primary app header — blue top bar used across all screens.
 * Matches Encircle's flat blue header pattern.
 */
export function AppHeader({ title, onBack, actions }: AppHeaderProps) {
  return (
    <header
      className="flex items-center justify-between sticky top-0 z-20 w-full"
      style={{
        height: "56px",
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

      {/* Center: title */}
      <h1
        className="text-center font-semibold truncate flex-1"
        style={{
          fontSize: "18px",
          color: "var(--color-text-on-primary)",
          letterSpacing: "-0.01em",
        }}
      >
        {title}
      </h1>

      {/* Right: actions or spacer */}
      <div className="flex items-center justify-end" style={{ width: "48px", flexShrink: 0 }}>
        {actions}
      </div>
    </header>
  );
}
