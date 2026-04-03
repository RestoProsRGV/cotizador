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
    <div className="flex flex-col gap-2">
      <span
        className="text-xs font-medium uppercase tracking-wide"
        style={{ color: "var(--color-text-secondary)" }}
      >
        {label}
      </span>
      <div
        className="grid gap-2"
        style={{ gridTemplateColumns: `repeat(${options.length}, 1fr)` }}
      >
        {options.map((opt) => {
          const selected = value === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              aria-pressed={selected}
              className="flex flex-col items-center justify-center gap-0.5 border px-2 py-3 text-sm font-semibold transition-colors select-none"
              style={{
                minHeight: "56px",
                borderRadius: "4px",
                borderWidth: selected ? "2px" : "1.5px",
                borderColor: selected ? "var(--color-primary)" : "var(--color-border)",
                backgroundColor: selected ? "var(--color-primary)" : "var(--color-surface)",
                color: selected ? "#ffffff" : "var(--color-text-primary)",
              }}
            >
              <span>{opt.label}</span>
              {opt.detail && (
                <span
                  className="text-xs font-normal"
                  style={{ opacity: selected ? 0.85 : 0.55 }}
                >
                  {opt.detail}
                </span>
              )}
            </button>
          );
        })}
      </div>
      {error && (
        <p className="text-xs" style={{ color: "var(--color-error)" }} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
