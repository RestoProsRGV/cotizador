import { Routes, Route, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Plus, ClipboardList } from "lucide-react";
import { NewEstimate } from "@/screens/NewEstimate";
import { Areas } from "@/screens/Areas";
import { Demo } from "@/screens/Demo";
import { Cleaning } from "@/screens/Cleaning";
import { Equipment } from "@/screens/Equipment";
import { General } from "@/screens/General";
import { Total } from "@/screens/Total";
import { Present } from "@/screens/Present";

function Home() {
  const { t } = useTranslation();
  return (
    <div
      className="flex min-h-screen flex-col"
      style={{ backgroundColor: "var(--color-background)" }}
    >
      {/* Blue header — no back button on home */}
      <header
        className="flex items-center justify-center w-full"
        style={{
          height: "56px",
          backgroundColor: "var(--color-header-primary)",
        }}
      >
        <h1
          className="font-semibold"
          style={{ fontSize: "18px", color: "var(--color-text-on-primary)" }}
        >
          RestoPros
        </h1>
      </header>

      {/* Empty state */}
      <div className="flex flex-1 flex-col items-center justify-center gap-6 px-8 text-center">
        <div
          className="flex items-center justify-center rounded-full"
          style={{
            width: "72px",
            height: "72px",
            backgroundColor: "var(--color-primary-bg)",
          }}
        >
          <ClipboardList size={32} style={{ color: "var(--color-primary)" }} aria-hidden />
        </div>
        <div>
          <p
            className="text-base font-semibold"
            style={{ color: "var(--color-text-primary)" }}
          >
            {t("home.noEstimates")}
          </p>
          <p className="mt-1 text-sm" style={{ color: "var(--color-text-secondary)" }}>
            {t("home.noEstimatesDetail")}
          </p>
        </div>
        <Link
          to="/estimates/new"
          className="flex items-center gap-2 font-semibold"
          style={{
            backgroundColor: "var(--color-primary)",
            color: "var(--color-text-on-primary)",
            height: "52px",
            paddingLeft: "24px",
            paddingRight: "24px",
            borderRadius: "4px",
            fontSize: "16px",
            textDecoration: "none",
          }}
        >
          <Plus size={20} aria-hidden />
          {t("newEstimate.submit")}
        </Link>
      </div>
    </div>
  );
}

export function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/estimates/new" element={<NewEstimate />} />
      <Route path="/estimates/:id/areas" element={<Areas />} />
      <Route path="/estimates/:id/demo" element={<Demo />} />
      <Route path="/estimates/:id/cleaning" element={<Cleaning />} />
      <Route path="/estimates/:id/equipment" element={<Equipment />} />
      <Route path="/estimates/:id/general" element={<General />} />
      <Route path="/estimates/:id/total" element={<Total />} />
      <Route path="/estimates/:id/present" element={<Present />} />
    </Routes>
  );
}
