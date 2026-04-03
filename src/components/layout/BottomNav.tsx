import { type ReactNode } from "react";

export interface NavItem {
  key: string;
  label: string;
  icon: ReactNode;
  activeIcon?: ReactNode;
  onClick: () => void;
}

interface BottomNavProps {
  items: NavItem[];
  activeKey: string;
}

/**
 * Bottom navigation bar — Encircle pattern.
 * White background, subtle top border, icon + label, blue active state.
 */
export function BottomNav({ items, activeKey }: BottomNavProps) {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-10 flex"
      style={{
        backgroundColor: "var(--color-surface)",
        borderTop: "1px solid var(--color-border)",
        height: "56px",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
      aria-label="Main navigation"
    >
      {items.map((item) => {
        const isActive = item.key === activeKey;
        return (
          <button
            key={item.key}
            type="button"
            onClick={item.onClick}
            className="flex flex-1 flex-col items-center justify-center gap-0.5"
            style={{
              color: isActive ? "var(--color-primary)" : "var(--color-text-secondary)",
              background: "transparent",
              border: "none",
              cursor: "pointer",
              fontSize: "11px",
              fontWeight: isActive ? 600 : 400,
            }}
            aria-current={isActive ? "page" : undefined}
          >
            <span style={{ fontSize: "20px", lineHeight: 1 }}>
              {isActive && item.activeIcon ? item.activeIcon : item.icon}
            </span>
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
