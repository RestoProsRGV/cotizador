import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "@/lib/supabase";
import { isEmergencyCall } from "@/lib/logic/general";
import { FieldInput } from "@/components/ui/FieldInput";
import { SelectButtonGroup } from "@/components/ui/SelectButton";
import { EmergencyBadge } from "@/components/ui/EmergencyBadge";
import { AppHeader } from "@/components/layout/AppHeader";
import { BottomButton } from "@/components/layout/BottomButton";

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

const FORM_ID = "new-estimate-form";

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

      const category =
        form.jobType === "water"
          ? form.waterCategory || null
          : form.jobType === "mold"
            ? "mold"
            : null;

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
      style={{ backgroundColor: "var(--color-background)" }}
    >
      <AppHeader title={t("newEstimate.title")} onBack={() => navigate(-1)} />

      {/* Scrollable content — bottom padding clears the fixed BottomButton */}
      <div className="flex-1" style={{ paddingBottom: "64px" }}>
        <form id={FORM_ID} onSubmit={handleSubmit} noValidate>
          {/* White card: client details */}
          <section
            className="flex flex-col gap-5 px-4 py-5"
            style={{ backgroundColor: "var(--color-surface)" }}
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
          </section>

          {/* Emergency badge in gray gap */}
          {isEmergency && (
            <div className="px-4 pt-3">
              <EmergencyBadge
                title={t("newEstimate.emergencyTitle")}
                detail={t("newEstimate.emergencyDetail")}
              />
            </div>
          )}

          {/* Gray separator */}
          <div
            aria-hidden
            style={{ height: "12px", backgroundColor: "var(--color-background)" }}
          />

          {/* White card: job classification */}
          <section
            className="flex flex-col gap-5 px-4 py-5"
            style={{ backgroundColor: "var(--color-surface)" }}
          >
            <SelectButtonGroup
              label={t("newEstimate.jobType")}
              options={jobTypeOptions}
              value={form.jobType}
              onChange={(v) => setForm((f) => ({ ...f, jobType: v as JobType }))}
              error={errors.jobType}
            />

            {form.jobType === "water" && (
              <SelectButtonGroup
                label={t("newEstimate.waterCategory")}
                options={categoryOptions}
                value={form.waterCategory}
                onChange={(v) =>
                  setForm((f) => ({ ...f, waterCategory: v as WaterCategory }))
                }
                error={errors.waterCategory}
              />
            )}
          </section>

          {/* Submit error */}
          {submitError && (
            <div className="px-4 pt-3">
              <p
                className="px-4 py-3 text-sm"
                style={{
                  backgroundColor: "var(--color-error-bg)",
                  color: "var(--color-error)",
                  borderRadius: "4px",
                }}
                role="alert"
              >
                {submitError}
              </p>
            </div>
          )}
        </form>
      </div>

      {/* Fixed bottom CTA — uses HTML form attribute to submit the form above */}
      <BottomButton
        label={t("newEstimate.submit")}
        loadingLabel={t("common.saving")}
        loading={submitting}
        formId={FORM_ID}
      />
    </div>
  );
}
