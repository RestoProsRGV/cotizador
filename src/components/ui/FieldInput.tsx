import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface FieldInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export const FieldInput = forwardRef<HTMLInputElement, FieldInputProps>(
  ({ label, error, className, id, ...props }, ref) => {
    const inputId = id ?? label.toLowerCase().replace(/\s+/g, "-");
    return (
      <div className="flex flex-col gap-1">
        <label
          htmlFor={inputId}
          className="text-xs uppercase tracking-wide"
          style={{ color: "var(--color-text-secondary)" }}
        >
          {label}
          {props.required && (
            <span className="ml-0.5" style={{ color: "var(--color-error)" }} aria-hidden>
              *
            </span>
          )}
        </label>
        <input
          ref={ref}
          id={inputId}
          className={cn(
            "w-full border px-3 text-base outline-none transition-colors",
            error ? "border-[var(--color-error)]" : "border-[var(--color-border)]",
            className
          )}
          style={{
            height: "48px",
            borderRadius: "4px",
            backgroundColor: "var(--color-surface)",
            color: "var(--color-text-primary)",
          }}
          onFocus={(e) => {
            if (!error) e.currentTarget.style.borderColor = "var(--color-primary)";
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = error
              ? "var(--color-error)"
              : "var(--color-border)";
            props.onBlur?.(e);
          }}
          {...props}
        />
        {error && (
          <p className="text-xs" style={{ color: "var(--color-error)" }} role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }
);

FieldInput.displayName = "FieldInput";
