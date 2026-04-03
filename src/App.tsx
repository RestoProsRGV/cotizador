import { Routes, Route, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { NewEstimate } from "@/screens/NewEstimate";

function Home() {
  const { t } = useTranslation();
  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center gap-8 px-4"
      style={{ backgroundColor: "var(--color-bg-secondary)" }}
    >
      <div className="text-center">
        <div
          className="mx-auto mb-4 flex items-center justify-center rounded-2xl text-2xl font-bold text-white"
          style={{
            width: "72px",
            height: "72px",
            backgroundColor: "var(--color-primary)",
          }}
        >
          RP
        </div>
        <h1
          className="text-3xl font-semibold"
          style={{ color: "var(--color-primary)" }}
        >
          RestoPros
        </h1>
        <p className="mt-1 text-base" style={{ color: "var(--color-text-secondary)" }}>
          Field Estimate Tool
        </p>
      </div>
      <Link
        to="/estimates/new"
        className="flex items-center justify-center rounded-lg font-semibold text-white"
        style={{
          backgroundColor: "var(--color-primary)",
          height: "52px",
          width: "100%",
          maxWidth: "320px",
          fontSize: "16px",
          textDecoration: "none",
        }}
      >
        {t("newEstimate.submit")}
      </Link>
    </div>
  );
}

function AreasPlaceholder() {
  const { t } = useTranslation();
  return (
    <div className="flex min-h-screen items-center justify-center">
      <p style={{ color: "var(--color-text-secondary)" }}>
        {t("areas.title")} — coming next
      </p>
    </div>
  );
}

export function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/estimates/new" element={<NewEstimate />} />
      <Route path="/estimates/:id/areas" element={<AreasPlaceholder />} />
    </Routes>
  );
}
