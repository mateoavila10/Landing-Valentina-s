import { useEffect, useState } from "react";
import { getSummary, getSeries, getSalesSummary, getSalesSeries } from "../api/client";
import BalanceCards from "../components/BalanceCards.jsx";
import LineChartSerie from "../components/LineChartSerie";
import Navbar from "../components/Navbar";
import KPICard from "../components/KPICard";
import dayjs from "dayjs";

function SkeletonCard() {
  return (
    <div className="kpi-card skeleton-card">
      <div className="skeleton skeleton-title" />
      <div className="skeleton skeleton-value" />
    </div>
  );
}

function SkeletonGrid() {
  return (
    <div className="balance-section">
      <div className="kpi-grid">
        {[0, 1, 2].map((i) => <SkeletonCard key={i} />)}
      </div>
      <div className="kpi-grid">
        {[0, 1, 2].map((i) => <SkeletonCard key={i} />)}
      </div>
      <div className="balance-divider" />
      <div className="kpi-grid">
        {[0, 1, 2].map((i) => <SkeletonCard key={i} />)}
      </div>
    </div>
  );
}

const SALES_PRESETS = [
  { key: "today",   label: "Hoy" },
  { key: "yesterday", label: "Ayer" },
  { key: "7days",   label: "7 días" },
  { key: "month",   label: "Este mes" },
  { key: "custom",  label: "Personalizado" },
];

function presetDates(key) {
  const today = dayjs().format("YYYY-MM-DD");
  if (key === "today")     return { from: today, to: today };
  if (key === "yesterday") { const y = dayjs().subtract(1, "day").format("YYYY-MM-DD"); return { from: y, to: y }; }
  if (key === "7days")     return { from: dayjs().subtract(6, "day").format("YYYY-MM-DD"), to: today };
  if (key === "month")     return { from: dayjs().startOf("month").format("YYYY-MM-DD"), to: dayjs().endOf("month").format("YYYY-MM-DD") };
  return null;
}

export default function Dashboard() {
  const [from, setFrom] = useState(dayjs().startOf("month").format("YYYY-MM-DD"));
  const [to, setTo] = useState(dayjs().endOf("month").format("YYYY-MM-DD"));

  const [summary, setSummary] = useState(null);
  const [series, setSeries] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const [metric, setMetric] = useState("ingresos");
  const [chartType, setChartType] = useState("line");

  // ── Ventas ──────────────────────────────────
  const [salesPreset, setSalesPreset] = useState("today");
  const [salesFrom, setSalesFrom] = useState(dayjs().format("YYYY-MM-DD"));
  const [salesTo, setSalesTo]   = useState(dayjs().format("YYYY-MM-DD"));
  const [salesSummary, setSalesSummary] = useState(null);
  const [salesSeries, setSalesSeries]   = useState(null);
  const [salesLoading, setSalesLoading] = useState(false);
  const [salesErr, setSalesErr]         = useState("");
  const [salesChartType, setSalesChartType] = useState("bar");

  function handleSalesPreset(key) {
    setSalesPreset(key);
    if (key !== "custom") {
      const { from: f, to: t } = presetDates(key);
      setSalesFrom(f);
      setSalesTo(t);
    }
  }

  async function load() {
    setLoading(true);
    setErr("");
    try {
      const [sum, ser] = await Promise.all([getSummary(from, to), getSeries(from, to)]);
      setSummary(sum);
      setSeries(ser);
    } catch (e) {
      setErr(e.message || "Error cargando datos");
    } finally {
      setLoading(false);
    }
  }

  async function loadSales() {
    setSalesLoading(true);
    setSalesErr("");
    try {
      const [sum, ser] = await Promise.all([getSalesSummary(salesFrom, salesTo), getSalesSeries(salesFrom, salesTo)]);
      setSalesSummary(sum);
      setSalesSeries(ser);
    } catch (e) {
      setSalesErr(e.message || "Error cargando ventas");
    } finally {
      setSalesLoading(false);
    }
  }

  useEffect(() => { load(); }, [from, to]);
  useEffect(() => { loadSales(); }, [salesFrom, salesTo]);

  const rangoLabel = `${dayjs(from).format("DD/MM/YYYY")} — ${dayjs(to).format("DD/MM/YYYY")}`;

  return (
    <>
      <Navbar />
      <div className="container">
        <div className="page-header">
          <h1>Dashboard</h1>
          <p className="page-subtitle">{rangoLabel}</p>
        </div>

        <div className="filters">
          <label>
            Desde:
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
          </label>
          <label>
            Hasta:
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </label>
          <button onClick={load} disabled={loading}>
            {loading ? "Cargando..." : "Actualizar"}
          </button>
        </div>

        {err && <div className="error-box">{err}</div>}

        {loading && !summary ? (
          <SkeletonGrid />
        ) : summary ? (
          <BalanceCards
            s1={summary.sucursales.sucursal1}
            s2={summary.sucursales.sucursal2}
            c={summary.sucursales.central}
            total={summary.total}
          />
        ) : null}

        <section className="stats-section">
          <div className="stats-header">
            <h2>Comparativa por sucursal</h2>
            <div className="stats-header-controls">
              <div className="metric-toggle">
                <button
                  type="button"
                  className={metric === "ingresos" ? "active" : ""}
                  onClick={() => setMetric("ingresos")}
                >
                  Ingresos
                </button>
                <button
                  type="button"
                  className={metric === "egresos" ? "active" : ""}
                  onClick={() => setMetric("egresos")}
                >
                  Egresos
                </button>
              </div>
              <div className="charttype-toggle">
                <button
                  type="button"
                  className={chartType === "line" ? "active" : ""}
                  onClick={() => setChartType("line")}
                >
                  Líneas
                </button>
                <button
                  type="button"
                  className={chartType === "bar" ? "active" : ""}
                  onClick={() => setChartType("bar")}
                >
                  Barras
                </button>
              </div>
            </div>
          </div>

          {series ? (
            <>
              <p className="metric-subtitle">
                Mostrando {metric === "ingresos" ? "ingresos" : "egresos"} diarios ·{" "}
                vista en {chartType === "line" ? "líneas" : "barras"}
              </p>
              <LineChartSerie
                dataByShop={series}
                metric={metric}
                chartType={chartType}
              />
            </>
          ) : loading ? (
            <div className="skeleton skeleton-chart" />
          ) : null}
        </section>

        {/* ── SECCIÓN VENTAS ───────────────────────── */}
        <div className="section-divider">
          <span>Ventas</span>
        </div>

        <section className="stats-section">
          <div className="stats-header">
            <h2>Ventas por sucursal</h2>
            <div className="charttype-toggle">
              <button
                type="button"
                className={salesChartType === "bar" ? "active" : ""}
                onClick={() => setSalesChartType("bar")}
              >
                Barras
              </button>
              <button
                type="button"
                className={salesChartType === "line" ? "active" : ""}
                onClick={() => setSalesChartType("line")}
              >
                Líneas
              </button>
            </div>
          </div>

          {/* Presets de fecha */}
          <div className="sales-filters">
            <div className="date-presets">
              {SALES_PRESETS.map((p) => (
                <button
                  key={p.key}
                  type="button"
                  className={salesPreset === p.key ? "active" : ""}
                  onClick={() => handleSalesPreset(p.key)}
                >
                  {p.label}
                </button>
              ))}
            </div>
            {salesPreset === "custom" && (
              <div className="sales-custom-dates">
                <label>
                  Desde:
                  <input
                    type="date"
                    value={salesFrom}
                    onChange={(e) => setSalesFrom(e.target.value)}
                  />
                </label>
                <label>
                  Hasta:
                  <input
                    type="date"
                    value={salesTo}
                    onChange={(e) => setSalesTo(e.target.value)}
                  />
                </label>
                <button onClick={loadSales} disabled={salesLoading}>
                  {salesLoading ? "Cargando..." : "Actualizar"}
                </button>
              </div>
            )}
          </div>

          {salesErr && <div className="error-box">{salesErr}</div>}

          {/* Cards de ventas */}
          {salesSummary ? (
            <div className="kpi-grid sales-kpi-grid">
              <KPICard
                title={`Ventas · ${salesSummary.centro.nombre}`}
                value={salesSummary.centro.ventas}
                subtitle="Total del período"
              />
              <KPICard
                title={`Ventas · ${salesSummary.tafi_viejo.nombre}`}
                value={salesSummary.tafi_viejo.ventas}
                subtitle="Total del período"
              />
              <KPICard
                title="Ventas · Total"
                value={salesSummary.total.ventas}
                subtitle="Ambas sucursales"
              />
            </div>
          ) : salesLoading ? (
            <div className="kpi-grid">
              {[0, 1, 2].map((i) => <SkeletonCard key={i} />)}
            </div>
          ) : null}

          {/* Gráfico de ventas diarias */}
          {salesSeries ? (
            <>
              <p className="metric-subtitle" style={{ marginTop: "1.25rem" }}>
                Ventas diarias · {dayjs(salesFrom).format("DD/MM/YYYY")} — {dayjs(salesTo).format("DD/MM/YYYY")}
              </p>
              <LineChartSerie
                dataByShop={salesSeries}
                metric="ingresos"
                chartType={salesChartType}
              />
            </>
          ) : salesLoading ? (
            <div className="skeleton skeleton-chart" style={{ marginTop: "1rem" }} />
          ) : null}
        </section>
      </div>
    </>
  );
}
