import { useEffect, useState } from "react";
import BalanceCards from "./components/BalanceCards";
import LineChartSerie from "./components/LineChartSerie";
import { fetchResumenAmbas, fetchSeriesAmbas } from "./api/client.js";

export default function App() {
  const [from, setFrom] = useState("2025-11-01");
  const [to, setTo] = useState("2025-11-30");

  const [resumen, setResumen] = useState(null);
  const [series, setSeries] = useState(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  // 🔹 selector de métrica y tipo de gráfico
  const [metric, setMetric] = useState("ingresos");   // "ingresos" | "egresos"
  const [chartType, setChartType] = useState("line"); // "line" | "bar"

  async function load() {
    try {
      setLoading(true);
      setErr("");
      const [r, s] = await Promise.all([
        fetchResumenAmbas({ from, to }),
        fetchSeriesAmbas({ from, to }),
      ]);
      setResumen(r);
      setSeries(s);
    } catch (e) {
      setErr(e.message || "Error cargando datos");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [from, to]); // recarga si cambiás el rango

  return (
    <div className="dashboard">
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

      {resumen && (
        <BalanceCards
          centro={resumen.centro}
          tafi_viejo={resumen.tafi_viejo}
          total={resumen.total}
        />
      )}

      {series && (
        <section className="stats-section">
          <div className="stats-header">
            <h2>Comparativa por sucursal</h2>

            <div className="stats-header-controls">
              {/* Toggle Ingresos/Egresos */}
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

              {/* Toggle Líneas/Barras */}
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

          <p className="metric-subtitle">
            Mostrando {metric === "ingresos" ? "ingresos" : "egresos"} diarios · vista en{" "}
            {chartType === "line" ? "líneas" : "barras"}
          </p>

          <LineChartSerie
            dataByShop={series}
            metric={metric}
            chartType={chartType}
          />
        </section>
      )}
    </div>
  );
}
