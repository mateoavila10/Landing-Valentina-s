import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
  BarChart,
  Bar,
} from "recharts";
import dayjs from "dayjs";

/**
 * dataByShop esperado:
 * {
 *   centro:     { ingresos: [{ dia: 'YYYY-MM-DD', ingresos: number }], egresos: [...] },
 *   tafi_viejo: { ingresos: [...], egresos: [...] }
 * }
 * o bien:
 * {
 *   sucursal1: { ingresos: [...], egresos: [...] },
 *   sucursal2: { ingresos: [...], egresos: [...] }
 * }
 */

const COLORS = {
  centro: "#2563eb", // azul
  tafi: "#f97316",   // naranja
};

const METRIC_LABEL = {
  ingresos: "Ingresos",
  egresos: "Egresos",
};

function formatDate(label) {
  const d = dayjs(label);
  if (!d.isValid()) return label;
  return d.format("DD/MM");
}

function formatDateFull(label) {
  const d = dayjs(label);
  if (!d.isValid()) return label;
  return d.format("DD/MM/YYYY");
}

function formatCurrency(value) {
  if (value == null) return "-";
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(value);
}

// Tooltip custom
function CustomTooltip({ active, payload, label, metric }) {
  if (!active || !payload || payload.length === 0) return null;

  const title = METRIC_LABEL[metric] || "Valor";

  return (
    <div className="chart-tooltip">
      <p className="chart-tooltip__title">
        {title} · {formatDateFull(label)}
      </p>
      {payload.map((entry) => (
        <p key={entry.dataKey} className="chart-tooltip__item">
          {entry.name}: {formatCurrency(entry.value)}
        </p>
      ))}
    </div>
  );
}

export default function LineChartSerie({
  dataByShop,
  metric = "ingresos",
  chartType = "line", // "line" | "bar"
}) {
  const sCentro = dataByShop?.centro || dataByShop?.sucursal1 || {};
  const sTafi = dataByShop?.tafi_viejo || dataByShop?.sucursal2 || {};

  const dias = new Set();
  (sCentro[metric] || []).forEach((d) => dias.add(String(d.dia)));
  (sTafi[metric] || []).forEach((d) => dias.add(String(d.dia)));
  const ordered = Array.from(dias).sort();

  const mapByDay = (arr) => {
    const m = new Map();
    (arr || []).forEach((d) => {
      const val = Number(d.ingresos ?? d.total ?? 0);
      m.set(String(d.dia), val);
    });
    return m;
  };

  const mCentro = mapByDay(sCentro[metric]);
  const mTafi = mapByDay(sTafi[metric]);

  const data = ordered.map((d) => ({
    dia: d,
    centro: mCentro.get(d) || 0,
    tafi: mTafi.get(d) || 0,
  }));

  const ChartComponent = chartType === "bar" ? BarChart : LineChart;

  return (
    <div className="chart-container">
      <ResponsiveContainer width="100%" height="100%">
        <ChartComponent
          data={data}
          margin={{ top: 16, right: 24, bottom: 8, left: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" opacity={0.25} />
          <XAxis dataKey="dia" tickFormatter={formatDate} tickMargin={8} />
          <YAxis
            tickFormatter={(v) =>
              v.toLocaleString("es-AR", { maximumFractionDigits: 0 })
            }
          />
          <Tooltip content={<CustomTooltip metric={metric} />} />
          <Legend />

          {chartType === "line" ? (
            <>
              <Line
                type="monotone"
                dataKey="centro"
                name="Centro"
                stroke={COLORS.centro}
                strokeWidth={3}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="tafi"
                name="Tafí Viejo"
                stroke={COLORS.tafi}
                strokeWidth={3}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            </>
          ) : (
            <>
              <Bar
                dataKey="centro"
                name="Centro"
                fill={COLORS.centro}
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="tafi"
                name="Tafí Viejo"
                fill={COLORS.tafi}
                radius={[4, 4, 0, 0]}
              />
            </>
          )}
        </ChartComponent>
      </ResponsiveContainer>
    </div>
  );
}
