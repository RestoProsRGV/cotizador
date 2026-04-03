import { Loader2 } from "lucide-react";

interface BottomButtonProps {
  label: string;
  loadingLabel?: string;
  loading?: boolean;
  disabled?: boolean;
  /** Submit a named form via HTML form attribute. Use instead of onClick for form submission. */
  formId?: string;
  onClick?: () => void;
}

/**
 * Fixed full-width primary action button pinned to the bottom of the screen.
 * Encircle pattern: blue, full-bleed, 52px tall, above the safe area.
 *
 * Pass `formId` to submit a form by id (preferred), or `onClick` for arbitrary actions.
 */
export function BottomButton({
  label,
  loadingLabel,
  loading = false,
  disabled = false,
  formId,
  onClick,
}: BottomButtonProps) {
  const isDisabled = disabled || loading;
  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-10"
      style={{ backgroundColor: "var(--color-surface)" }}
    >
      <button
        type="submit"
        form={formId}
        disabled={isDisabled}
        onClick={formId ? undefined : onClick}
        className="flex w-full items-center justify-center gap-2 font-semibold transition-colors"
        style={{
          height: "52px",
          fontSize: "16px",
          backgroundColor: isDisabled ? "var(--color-primary-light)" : "var(--color-primary)",
          color: "var(--color-text-on-primary)",
          border: "none",
          cursor: isDisabled ? "not-allowed" : "pointer",
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
        }}
      >
        {loading ? (
          <>
            <Loader2 size={18} className="animate-spin" aria-hidden />
            {loadingLabel ?? label}
          </>
        ) : (
          label
        )}
      </button>
    </div>
  );
}
