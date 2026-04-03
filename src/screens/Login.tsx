import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { FieldInput } from "@/components/ui/FieldInput";

export function Login() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? "/estimates";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (authError) {
      setError(t("login.invalidCredentials"));
      setLoading(false);
      return;
    }

    navigate(from, { replace: true });
  }

  return (
    <div
      className="flex min-h-screen flex-col"
      style={{ backgroundColor: "var(--color-background)" }}
    >
      {/* Blue header */}
      <header
        className="flex items-center justify-center"
        style={{ height: "56px", backgroundColor: "var(--color-header-primary)" }}
      >
        <h1
          className="font-semibold"
          style={{ fontSize: "18px", color: "var(--color-text-on-primary)" }}
        >
          RestoPros
        </h1>
      </header>

      {/* Form */}
      <div className="flex flex-1 flex-col items-center justify-center px-4">
        <div
          className="w-full max-w-sm rounded-sm"
          style={{ backgroundColor: "var(--color-surface)" }}
        >
          {/* Logo area */}
          <div className="flex flex-col items-center gap-2 px-6 pt-8 pb-6">
            <div
              className="flex items-center justify-center rounded-full text-xl font-bold"
              style={{
                width: "56px",
                height: "56px",
                backgroundColor: "var(--color-primary)",
                color: "var(--color-text-on-primary)",
              }}
            >
              RP
            </div>
            <p
              className="text-sm"
              style={{ color: "var(--color-text-secondary)" }}
            >
              {t("login.subtitle")}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5 px-6 pb-8">
            <FieldInput
              label={t("login.email")}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              inputMode="email"
              autoCapitalize="none"
            />
            <FieldInput
              label={t("login.password")}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />

            {error && (
              <p
                className="rounded px-3 py-2 text-sm"
                style={{
                  backgroundColor: "var(--color-error-bg)",
                  color: "var(--color-error)",
                  borderRadius: "4px",
                }}
                role="alert"
              >
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex items-center justify-center gap-2 font-semibold transition-colors"
              style={{
                height: "52px",
                borderRadius: "4px",
                backgroundColor: loading ? "var(--color-primary-light)" : "var(--color-primary)",
                color: "var(--color-text-on-primary)",
                border: "none",
                fontSize: "16px",
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" aria-hidden />
                  {t("login.signingIn")}
                </>
              ) : (
                t("login.signIn")
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
