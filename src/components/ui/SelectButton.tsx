import { cn } from "@/lib/utils";

interface SelectOption {
  value: string;
  label: string;
  detail?: string;
}

interface SelectButtonGroupProps {
  label: string;
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

export function SelectButtonGroup({
  label,
  options,
  value,
  onChange,
  error,
}: SelectButtonGroupProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm font-medium" style={{ color: "var(--color-text)" }}>
        {label}
      </span>
      <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${options.length}, 1fr)` }}>
        {options.map((opt) => {
          const selected = value === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              aria-pressed={selected}
              className={cn(
                "flex flex-col items-center justify-center rounded-lg border-2 px-2 py-3 text-sm font-semibold transition-colors",
                "min-h-[56px] select-none"
              )}
              style={
                selected
                  ? {
                      backgroundColor: "var(--color-primary)",
                      borderColor: "var(--color-primary)",
                      color: "#ffffff",
                    }
                  : {
                      backgroundColor: "var(--color-bg)",
                      borderColor: "var(--color-border)",
                      color: "var(--color-text)",
                    }
              }
            >
              <span>{opt.label}</span>
              {opt.detail && (
                <span
                  className="mt-0.5 text-xs font-normal"
                  style={{ opacity: selected ? 0.8 : 0.6 }}
                >
                  {opt.detail}
                </span>
              )}
            </button>
          );
        })}
      </div>
      {error && (
        <p className="text-sm" style={{ color: "var(--color-error)" }} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
