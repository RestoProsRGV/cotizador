import { Plus } from "lucide-react";

interface FABProps {
  onClick: () => void;
  label: string;
  /** Bottom offset in px. Default 80 (sits above bottom nav). */
  bottom?: number;
}

/**
 * Floating Action Button — blue circle with white + icon.
 * Only component with a shadow (exception to the flat design rule).
 */
export function FAB({ onClick, label, bottom = 80 }: FABProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="fixed right-4 flex items-center justify-center rounded-full"
      style={{
        bottom: `${bottom}px`,
        width: "56px",
        height: "56px",
        backgroundColor: "var(--color-primary)",
        color: "var(--color-text-on-primary)",
        border: "none",
        cursor: "pointer",
        boxShadow: "0 2px 8px rgba(0,0,0,0.20)",
        zIndex: 20,
      }}
    >
      <Plus size={24} aria-hidden />
    </button>
  );
}
