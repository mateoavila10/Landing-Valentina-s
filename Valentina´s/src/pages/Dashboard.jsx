import { useEffect, useState } from "react";
import { getSummary, getSeries } from "../api/client";
import BalanceCards from "../components/BalanceCards.jsx";
import LineChartSerie from "../components/LineChartSerie";
import Navbar from "../components/Navbar";
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

export default function Dashboard() {
  const [from, setFrom] = useState(dayjs().startOf("month").format("YYYY-MM-DD"));
  const [to, setTo] = useState(dayjs().endOf("month").format("YYYY-MM-DD"));

  const [summary, setSummary] = useState(null);
  const [series, setSeries] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const [metric, setMetric] = useState("ingresos");
  const [chartType, setChartType] = useState("line");

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

  useEffect(() => {
    load();
  }, [from, to]);

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
      </div>
    </>
  );
}
