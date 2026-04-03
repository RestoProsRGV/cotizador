import { Routes, Route } from "react-router-dom";

function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-3xl font-semibold" style={{ color: "var(--color-primary)" }}>
          Cotizador
        </h1>
        <p className="mt-2 text-[var(--color-text-secondary)]">
          On-site field closing tool for RestoPros
        </p>
      </div>
    </div>
  );
}

export function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
    </Routes>
  );
}
