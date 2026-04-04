import { useState, useEffect, useRef, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { isEmergencyCall } from "@/lib/logic/general";
import { AppHeader } from "@/components/layout/AppHeader";
import { EstimateNav } from "@/components/layout/EstimateNav";
import { FieldInput } from "@/components/ui/FieldInput";
import { SelectButtonGroup } from "@/components/ui/SelectButton";
import { EmergencyBadge } from "@/components/ui/EmergencyBadge";

type JobType = "water" | "mold" | "storm" | "fire";
type WaterCategory = "cat1" | "cat2" | "cat3";

function toDatetimeLocal(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function Setup() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const initialized = useRef(false);

  const { data: estimate, isLoading } = useQuery({
    queryKey: ["estimate", id],
    queryFn: async () => {
      const { data } = await supabase
        .from("estimates")
        .select("id, client_name, job_address, job_type, category, emergency, created_at")
        .eq("id", id!)
        .single();
      return data;
    },
    enabled: !!id,
  });

  const [clientName, setClientName] = useState("");
  const [address, setAddress] = useState("");
  const [jobType, setJobType] = useState<JobType | "">("");
  const [waterCategory, setWaterCategory] = useState<WaterCategory | "">("");
  const [datetime, setDatetime] = useState("");

  // Initialize local state once from fetched estimate
  useEffect(() => {
    if (!estimate || initialized.current) return;
    initialized.current = true;
    setClientName(estimate.client_name ?? "");
    setAddress(estimate.job_address ?? "");
    setJobType((estimate.job_type as JobType) ?? "");
    if (estimate.job_type === "water") {
      setWaterCategory((estimate.category as WaterCategory) ?? "");
    }
    setDatetime(toDatetimeLocal(new Date(estimate.created_at)));
  }, [estimate]);

  const isEmergency = useMemo(
    () => (datetime ? isEmergencyCall(new Date(datetime)) : false),
    [datetime],
  );

  async function savePatch(patch: Record<string, unknown>) {
    await supabase.from("estimates").update(patch).eq("id", id!);
  }

  async function handleClientNameBlur() {
    const trimmed = clientName.trim();
    if (!trimmed || trimmed === estimate?.client_name) return;
    await savePatch({ client_name: trimmed });
  }

  async function handleAddressBlur() {
    const trimmed = address.trim();
    if (!trimmed || trimmed === estimate?.job_address) return;
    await savePatch({ job_address: trimmed });
  }

  async function handleDatetimeBlur() {
    if (!datetime) return;
    await savePatch({ emergency: isEmergencyCall(new Date(datetime)) });
  }

  async function handleJobTypeChange(newType: string) {
    const jt = newType as JobType;
    setJobType(jt);
    const patch: Record<string, unknown> = { job_type: jt };
    if (jt === "mold") {
      patch.category = "mold";
      setWaterCategory("");
    } else if (jt !== "water") {
      patch.category = null;
      setWaterCategory("");
    }
    await savePatch(patch);
  }

  async function handleCategoryChange(cat: string) {
    setWaterCategory(cat as WaterCategory);
    await savePatch({ category: cat });
  }

  const jobTypeOptions = [
    { value: "water", label: t("newEstimate.jobTypeWater") },
    { value: "mold",  label: t("newEstimate.jobTypeMold") },
    { value: "storm", label: t("newEstimate.jobTypeStorm") },
    { value: "fire",  label: t("newEstimate.jobTypeFire") },
  ];

  const categoryOptions = [
    { value: "cat1", label: t("newEstimate.cat1"), detail: t("newEstimate.cat1Detail") },
    { value: "cat2", label: t("newEstimate.cat2"), detail: t("newEstimate.cat2Detail") },
    { value: "cat3", label: t("newEstimate.cat3"), detail: t("newEstimate.cat3Detail") },
  ];

  if (isLoading) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          minHeight: "100vh",
          backgroundColor: "var(--color-background)",
        }}
      >
        <AppHeader title={t("estimateNav.setup")} onBack={() => navigate(-1)} />
        <div
          style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          <p style={{ color: "var(--color-text-secondary)" }}>{t("common.loading")}</p>
        </div>
        <EstimateNav />
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        backgroundColor: "var(--color-background)",
      }}
    >
      <AppHeader title={t("estimateNav.setup")} onBack={() => navigate(-1)} />

      {/* Scrollable content — bottom padding clears the fixed EstimateNav */}
      <div style={{ flex: 1, paddingBottom: "56px" }}>
        {/* White card: client details */}
        <section
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "20px",
            padding: "20px 16px",
            backgroundColor: "var(--color-surface)",
          }}
        >
          <FieldInput
            label={t("newEstimate.clientName")}
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            onBlur={handleClientNameBlur}
            autoCapitalize="words"
            autoComplete="name"
          />
          <FieldInput
            label={t("newEstimate.address")}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            onBlur={handleAddressBlur}
            autoComplete="street-address"
          />
          <FieldInput
            label={t("newEstimate.dateTime")}
            type="datetime-local"
            value={datetime}
            onChange={(e) => setDatetime(e.target.value)}
            onBlur={handleDatetimeBlur}
          />
        </section>

        {/* Emergency badge in gray gap */}
        {isEmergency && (
          <div style={{ padding: "12px 16px 0" }}>
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
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "20px",
            padding: "20px 16px",
            backgroundColor: "var(--color-surface)",
          }}
        >
          <SelectButtonGroup
            label={t("newEstimate.jobType")}
            options={jobTypeOptions}
            value={jobType}
            onChange={handleJobTypeChange}
          />

          {jobType === "water" && (
            <SelectButtonGroup
              label={t("newEstimate.waterCategory")}
              options={categoryOptions}
              value={waterCategory}
              onChange={handleCategoryChange}
            />
          )}
        </section>
      </div>

      <EstimateNav />
    </div>
  );
}
