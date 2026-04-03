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
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor={inputId}
          className="text-sm font-medium"
          style={{ color: "var(--color-text)" }}
        >
          {label}
          {props.required && (
            <span className="ml-1" style={{ color: "var(--color-error)" }} aria-hidden>
              *
            </span>
          )}
        </label>
        <input
          ref={ref}
          id={inputId}
          className={cn(
            "w-full rounded-lg border px-3 text-base outline-none transition-shadow",
            "focus:ring-2",
            error ? "border-[var(--color-error)]" : "border-[var(--color-border)]",
            className
          )}
          style={{
            height: "48px",
            backgroundColor: "var(--color-bg)",
            color: "var(--color-text)",
            // focus ring via CSS since Tailwind v4 needs inline for CSS vars
          }}
          onFocus={(e) => {
            e.currentTarget.style.boxShadow = "0 0 0 2px var(--color-primary)";
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            e.currentTarget.style.boxShadow = "";
            props.onBlur?.(e);
          }}
          {...props}
        />
        {error && (
          <p className="text-sm" style={{ color: "var(--color-error)" }} role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }
);

FieldInput.displayName = "FieldInput";
