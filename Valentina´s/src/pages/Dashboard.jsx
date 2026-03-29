import { useEffect, useState } from "react";
import { getSummary, getSeries } from "../api/client";
import BalanceCards from "../components/BalanceCards.jsx";
import LineChartSerie from "../components/LineChartSerie";
import dayjs from "dayjs";

export default function Dashboard() {
  const [from, setFrom] = useState(dayjs().startOf("month").format("YYYY-MM-DD"));
  const [to, setTo] = useState(dayjs().endOf("month").format("YYYY-MM-DD"));

  const [summary, setSummary] = useState(null);
  const [series, setSeries] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  // 🔹 selector de métrica y tipo de gráfico
  const [metric, setMetric] = useState("ingresos"); // "ingresos" | "egresos"
  const [chartType, setChartType] = useState("line"); // "line" | "bar"

  async function load() {
    setLoading(true);
    setErr("");
    try {
      const [sum, ser] = await Promise.all([
        getSummary(from, to),
        getSeries(from, to),
      ]);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="container">
      <h1>Dashboard de Sucursales</h1>
      <p>Rango: {from} → {to}</p>

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

      {summary && (
        <BalanceCards
          s1={summary.sucursales.sucursal1}
          s2={summary.sucursales.sucursal2}
          c={summary.sucursales.central}
          total={summary.total}
        />
      )}

      {/* 🔹 Sección de estadísticas con toggles */}
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

        {series && (
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
        )}
      </section>
    </div>
  );
}
