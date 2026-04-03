import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ChevronLeft, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { isEmergencyCall } from "@/lib/logic/general";
import { FieldInput } from "@/components/ui/FieldInput";
import { SelectButtonGroup } from "@/components/ui/SelectButton";
import { EmergencyBadge } from "@/components/ui/EmergencyBadge";

type JobType = "water" | "mold" | "storm";
type WaterCategory = "cat1" | "cat2" | "cat3";

interface FormState {
  clientName: string;
  address: string;
  datetime: string;
  jobType: JobType | "";
  waterCategory: WaterCategory | "";
}

interface FormErrors {
  clientName?: string;
  address?: string;
  jobType?: string;
  waterCategory?: string;
}

function toDatetimeLocal(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function NewEstimate() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [form, setForm] = useState<FormState>({
    clientName: "",
    address: "",
    datetime: toDatetimeLocal(new Date()),
    jobType: "",
    waterCategory: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Auto-clear waterCategory when job type changes away from water
  useEffect(() => {
    if (form.jobType !== "water") {
      setForm((f) => ({ ...f, waterCategory: "" }));
    }
  }, [form.jobType]);

  const isEmergency = useMemo(
    () => (form.datetime ? isEmergencyCall(new Date(form.datetime)) : false),
    [form.datetime]
  );

  function validate(): FormErrors {
    const e: FormErrors = {};
    if (!form.clientName.trim()) e.clientName = t("newEstimate.validationClientName");
    if (!form.address.trim()) e.address = t("newEstimate.validationAddress");
    if (!form.jobType) e.jobType = t("newEstimate.validationJobType");
    if (form.jobType === "water" && !form.waterCategory)
      e.waterCategory = t("newEstimate.validationCategory");
    return e;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setErrors({});
    setSubmitting(true);
    setSubmitError(null);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const session = sessionData.session;

      if (!session) {
        setSubmitError(t("common.authRequired"));
        setSubmitting(false);
        return;
      }

      // Resolve category: water → chosen cat, mold → "mold", storm → null
      const category =
        form.jobType === "water"
          ? form.waterCategory || null
          : form.jobType === "mold"
            ? "mold"
            : null;

      // Fetch current user's tenant_id from public.users
      const { data: profile, error: profileError } = await supabase
        .from("users")
        .select("tenant_id")
        .eq("id", session.user.id)
        .single();

      if (profileError || !profile) {
        setSubmitError(t("common.error"));
        setSubmitting(false);
        return;
      }

      const { data: estimate, error: insertError } = await supabase
        .from("estimates")
        .insert({
          tenant_id: profile.tenant_id,
          user_id: session.user.id,
          client_name: form.clientName.trim(),
          job_address: form.address.trim(),
          job_type: form.jobType,
          category,
          emergency: isEmergency,
          status: "draft",
        })
        .select("id")
        .single();

      if (insertError || !estimate) {
        setSubmitError(t("common.error"));
        setSubmitting(false);
        return;
      }

      navigate(`/estimates/${estimate.id}/areas`);
    } catch {
      setSubmitError(t("common.error"));
      setSubmitting(false);
    }
  }

  const jobTypeOptions = [
    { value: "water", label: t("newEstimate.jobTypeWater") },
    { value: "mold", label: t("newEstimate.jobTypeMold") },
    { value: "storm", label: t("newEstimate.jobTypeStorm") },
  ];

  const categoryOptions = [
    { value: "cat1", label: t("newEstimate.cat1"), detail: t("newEstimate.cat1Detail") },
    { value: "cat2", label: t("newEstimate.cat2"), detail: t("newEstimate.cat2Detail") },
    { value: "cat3", label: t("newEstimate.cat3"), detail: t("newEstimate.cat3Detail") },
  ];

  return (
    <div
      className="flex min-h-screen flex-col"
      style={{ backgroundColor: "var(--color-bg-secondary)" }}
    >
      {/* Header */}
      <header
        className="flex items-center gap-2 px-4 py-3 sticky top-0 z-10"
        style={{ backgroundColor: "var(--color-primary)" }}
      >
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex items-center justify-center rounded-lg p-1 -ml-1"
          style={{ color: "#ffffff", minWidth: "48px", minHeight: "48px" }}
          aria-label={t("common.back")}
        >
          <ChevronLeft size={24} aria-hidden />
        </button>
        <h1 className="text-lg font-semibold" style={{ color: "#ffffff" }}>
          {t("newEstimate.title")}
        </h1>
      </header>

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-6 px-4 py-6 mx-auto w-full max-w-lg"
        noValidate
      >
        <FieldInput
          label={t("newEstimate.clientName")}
          placeholder={t("newEstimate.clientNamePlaceholder")}
          value={form.clientName}
          onChange={(e) => setForm((f) => ({ ...f, clientName: e.target.value }))}
          error={errors.clientName}
          required
          autoComplete="name"
          autoCapitalize="words"
        />

        <FieldInput
          label={t("newEstimate.address")}
          placeholder={t("newEstimate.addressPlaceholder")}
          value={form.address}
          onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
          error={errors.address}
          required
          autoComplete="street-address"
        />

        <FieldInput
          label={t("newEstimate.dateTime")}
          type="datetime-local"
          value={form.datetime}
          onChange={(e) => setForm((f) => ({ ...f, datetime: e.target.value }))}
        />

        {/* Emergency badge — shown when time is outside M-F 8am–5pm */}
        {isEmergency && (
          <EmergencyBadge
            title={t("newEstimate.emergencyTitle")}
            detail={t("newEstimate.emergencyDetail")}
          />
        )}

        <SelectButtonGroup
          label={t("newEstimate.jobType")}
          options={jobTypeOptions}
          value={form.jobType}
          onChange={(v) => setForm((f) => ({ ...f, jobType: v as JobType }))}
          error={errors.jobType}
        />

        {/* Water category — only when Water is selected */}
        {form.jobType === "water" && (
          <SelectButtonGroup
            label={t("newEstimate.waterCategory")}
            options={categoryOptions}
            value={form.waterCategory}
            onChange={(v) => setForm((f) => ({ ...f, waterCategory: v as WaterCategory }))}
            error={errors.waterCategory}
          />
        )}

        {submitError && (
          <p
            className="rounded-lg px-4 py-3 text-sm"
            style={{
              backgroundColor: "var(--color-error-bg)",
              color: "var(--color-error)",
            }}
            role="alert"
          >
            {submitError}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="flex items-center justify-center gap-2 rounded-lg font-semibold transition-colors disabled:opacity-60"
          style={{
            backgroundColor: "var(--color-primary)",
            color: "#ffffff",
            height: "52px",
            fontSize: "16px",
          }}
          onMouseEnter={(e) => {
            if (!submitting)
              (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                "var(--color-primary-hover)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor =
              "var(--color-primary)";
          }}
        >
          {submitting ? (
            <>
              <Loader2 size={18} className="animate-spin" aria-hidden />
              {t("common.saving")}
            </>
          ) : (
            t("newEstimate.submit")
          )}
        </button>
      </form>
    </div>
  );
}
