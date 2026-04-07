import { useEffect, useState } from "react";
import { getSummary, getSeries, getSalesSummary, getSalesDetails } from "../api/client";
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
  const [salesDetails, setSalesDetails] = useState(null);
  const [salesLoading, setSalesLoading] = useState(false);
  const [salesErr, setSalesErr]         = useState("");
  const [salesPage, setSalesPage]       = useState(1);
  const SALES_PAGE_SIZE = 20;

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
      const [sum, details] = await Promise.all([getSalesSummary(salesFrom, salesTo), getSalesDetails(salesFrom, salesTo)]);
      setSalesSummary(sum);
      setSalesDetails(details);
      setSalesPage(1);
    } catch (e) {
      setSalesErr(e.message || "Error cargando ventas");
    } finally {
      setSalesLoading(false);
    }
  }

  useEffect(() => { load(); }, [from, to]);
  useEffect(() => { loadSales(); }, [salesFrom, salesTo]);

  const salesTotalPages = salesDetails ? Math.ceil(salesDetails.length / SALES_PAGE_SIZE) : 0;
  const salesPageRows   = salesDetails ? salesDetails.slice((salesPage - 1) * SALES_PAGE_SIZE, salesPage * SALES_PAGE_SIZE) : [];

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

          {/* Cards resumen */}
          {salesSummary ? (
            <div className="kpi-grid sales-kpi-grid">
              <KPICard
                title={`Items vendidos · ${salesSummary.centro.nombre}`}
                value={salesSummary.centro.subtotal}
                subtitle={`${salesSummary.centro.items} artículos`}
              />
              <KPICard
                title={`Items vendidos · ${salesSummary.tafi_viejo.nombre}`}
                value={salesSummary.tafi_viejo.subtotal}
                subtitle={`${salesSummary.tafi_viejo.items} artículos`}
              />
              <KPICard
                title="Total · Ambas sucursales"
                value={salesSummary.total.subtotal}
                subtitle={`${salesSummary.total.items} artículos`}
              />
            </div>
          ) : salesLoading ? (
            <div className="kpi-grid">
              {[0, 1, 2].map((i) => <SkeletonCard key={i} />)}
            </div>
          ) : null}

          {/* Tabla de detalle */}
          {salesLoading && !salesDetails ? (
            <div className="skeleton skeleton-chart" style={{ marginTop: "1.25rem" }} />
          ) : salesDetails?.length > 0 ? (
            <>
              <div className="sales-table-wrapper">
                <table className="sales-table">
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Sucursal</th>
                      <th>Producto</th>
                      <th>Talle</th>
                      <th>Cant.</th>
                      <th>Precio unit.</th>
                      <th>Subtotal</th>
                      <th>Método</th>
                      <th>Vendedor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {salesPageRows.map((row) => (
                      <tr key={row.IdDetalle}>
                        <td>{dayjs(row.FechaVenta).format("DD/MM/YY HH:mm")}</td>
                        <td><span className={`sales-badge sales-badge--${row.id_sucursal === 1 ? "centro" : "tafi"}`}>{row.sucursal}</span></td>
                        <td>{row.producto || "—"}</td>
                        <td>{row.Talle ?? "—"}</td>
                        <td>{row.Cantidad}</td>
                        <td>{Number(row.PrecioVidriera).toLocaleString("es-AR", { style: "currency", currency: "ARS" })}</td>
                        <td className="sales-subtotal">{Number(row.SubTotal).toLocaleString("es-AR", { style: "currency", currency: "ARS" })}</td>
                        <td>{row.MetodoPago || "—"}</td>
                        <td>{row.empleado || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="sales-pagination">
                <button onClick={() => setSalesPage((p) => Math.max(1, p - 1))} disabled={salesPage === 1}>&#8249;</button>
                <span>Página {salesPage} de {salesTotalPages} · {salesDetails.length} registros</span>
                <button onClick={() => setSalesPage((p) => Math.min(salesTotalPages, p + 1))} disabled={salesPage === salesTotalPages}>&#8250;</button>
              </div>
            </>
          ) : salesDetails?.length === 0 ? (
            <p className="metric-subtitle" style={{ marginTop: "1rem" }}>Sin ventas para el período seleccionado.</p>
          ) : null}
        </section>
      </div>
    </>
  );
}
