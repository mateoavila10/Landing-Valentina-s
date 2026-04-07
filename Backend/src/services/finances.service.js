import { pool } from "./db.js";

/* ──────────────────────────────────────────────
   🛒 VENTAS - Resumen por sucursal
   ────────────────────────────────────────────── */
export async function ventasSummary({ from, to }) {
  const Q = `
    SELECT COALESCE(SUM(Total), 0) AS total
    FROM ventas
    WHERE id_sucursal = ?
      AND FechaVenta >= ?
      AND FechaVenta < DATE_ADD(?, INTERVAL 1 DAY)
      AND IsDeleted = 0
  `;
  const [[rowsCentro], [rowsTafi]] = await Promise.all([
    pool.query(Q, [1, from, to]),
    pool.query(Q, [2, from, to]),
  ]);
  const centro = Number(rowsCentro[0]?.total || 0);
  const tafi   = Number(rowsTafi[0]?.total || 0);
  return {
    centro:     { nombre: "Centro",     ventas: centro },
    tafi_viejo: { nombre: "Tafí Viejo", ventas: tafi },
    total:      { ventas: centro + tafi },
  };
}

/* ──────────────────────────────────────────────
   🛒 VENTAS - Series diarias por sucursal
   ────────────────────────────────────────────── */
export async function ventasSeries({ from, to }) {
  const Q = `
    SELECT DATE(FechaVenta) AS dia, COALESCE(SUM(Total), 0) AS ventas
    FROM ventas
    WHERE id_sucursal = ?
      AND FechaVenta >= ?
      AND FechaVenta < DATE_ADD(?, INTERVAL 1 DAY)
      AND IsDeleted = 0
    GROUP BY DATE(FechaVenta)
    ORDER BY dia;
  `;
  const [[rowsCentro], [rowsTafi]] = await Promise.all([
    pool.query(Q, [1, from, to]),
    pool.query(Q, [2, from, to]),
  ]);
  const mapSerie = (rows) => rows.map((r) => ({ dia: r.dia, ingresos: Number(r.ventas || 0) }));
  const centro     = { ingresos: mapSerie(rowsCentro), egresos: [] };
  const tafi_viejo = { ingresos: mapSerie(rowsTafi),   egresos: [] };
  return { centro, tafi_viejo, sucursal1: centro, sucursal2: tafi_viejo };
}

/* ──────────────────────────────────────────────
   📊 TABLAS
   - ventas(IdVenta, FechaVenta, Total, id_sucursal)
   - gastos(IdGasto, MontoGasto, FechaGasto, id_sucursal)
   - sucursal(id_sucursal, nombre)
   ────────────────────────────────────────────── */

// 🟩 Ingresos
const Q_INGRESOS = `
  SELECT COALESCE(SUM(TotalIngresos), 0) AS total
  FROM balance
  WHERE id_sucursal = ?
    AND Fecha BETWEEN ? AND DATE_ADD(?, INTERVAL 1 DAY)
`;

// 🟥 Egresos
const Q_EGRESOS = `
  SELECT COALESCE(SUM(TotalEgresos), 0) AS total
  FROM balance
  WHERE id_sucursal = ?
    AND Fecha BETWEEN ? AND DATE_ADD(?, INTERVAL 1 DAY)
`;

// 🏪 Nombre sucursal
const Q_NOMBRE_SUCURSAL = `
  SELECT nombre
  FROM sucursal
  WHERE id_sucursal = ?
`;

/* ──────────────────────────────────────────────
   🔹 KPI POR SUCURSAL
   ────────────────────────────────────────────── */
export async function kpisSucursalById({ sucursalId, from, to }) {
  try {
    const [[ingresosRows], [egresosRows], [nombreRows]] = await Promise.all([
      pool.query(Q_INGRESOS, [sucursalId, from, to]),
      pool.query(Q_EGRESOS, [sucursalId, from, to]),
      pool.query(Q_NOMBRE_SUCURSAL, [sucursalId]),
    ]);


    const ingresos = Number(ingresosRows[0]?.total || 0);
    const egresos = Number(egresosRows[0]?.total || 0);
    const balance = ingresos - egresos;
    const nombre = nombreRows[0]?.nombre || (sucursalId === 1 ? "Centro" : "Tafí Viejo");

    console.log(`📊 [${nombre}] Ingresos: ${ingresos} | Egresos: ${egresos} | Balance: ${balance}`);

    return { sucursalId, nombre, ingresos, egresos, balance };
  } catch (err) {
    console.error("❌ Error en kpisSucursalById:", err.message);
    return { sucursalId, nombre: null, ingresos: 0, egresos: 0, balance: 0 };
  }
}

/* ──────────────────────────────────────────────
   🔹 KPI GENERAL (Centro + Tafí Viejo)
   ────────────────────────────────────────────── */
export async function kpisTodas({ from, to }) {
  const [centro, tafi] = await Promise.all([
    kpisSucursalById({ sucursalId: 1, from, to }),
    kpisSucursalById({ sucursalId: 2, from, to }),
  ]);

  const total = {
    ingresos: centro.ingresos + tafi.ingresos,
    egresos: centro.egresos + tafi.egresos,
    balance: centro.balance + tafi.balance,
  };

  return {
    rango: { desde: from, hasta: to },
    sucursales: { centro, tafi_viejo: tafi },
    total,
    autoRango: false,
  };
}

/* ──────────────────────────────────────────────
   📈 SERIES COMPARATIVAS (gráficos)
   ────────────────────────────────────────────── */
export async function seriesComparativa({ from, to }) {
  const Q_SERIES = `
    SELECT 
      DATE(Fecha) AS dia,
      COALESCE(SUM(TotalIngresos), 0) AS ingresos,
      COALESCE(SUM(TotalEgresos), 0) AS egresos
    FROM balance
    WHERE id_sucursal = ?
      AND Fecha BETWEEN ? AND DATE_ADD(?, INTERVAL 1 DAY)
    GROUP BY DATE(Fecha)
    ORDER BY dia;
  `;

  // 1 = Centro, 2 = Tafí Viejo
  const [rowsCentroPromise, rowsTafiPromise] = await Promise.all([
    pool.query(Q_SERIES, [1, from, to]),
    pool.query(Q_SERIES, [2, from, to]),
  ]);

  const [rowsCentro] = rowsCentroPromise; // array de filas
  const [rowsTafi]   = rowsTafiPromise;

  const mapSerie = (rows, campo) =>
    rows.map((r) => ({
      dia: r.dia,
      // siempre se llama "ingresos" porque tu LineChartSerie
      // lee d.ingresos ?? d.total como valor numérico
      ingresos: Number(r[campo] || 0),
    }));

  const centro = {
    ingresos: mapSerie(rowsCentro, "ingresos"),
    egresos:  mapSerie(rowsCentro, "egresos"),
  };

  const tafi_viejo = {
    ingresos: mapSerie(rowsTafi, "ingresos"),
    egresos:  mapSerie(rowsTafi, "egresos"),
  };

  // Devolvemos con claves dobles para máxima compatibilidad
  return {
    centro,
    tafi_viejo,
    sucursal1: centro,
    sucursal2: tafi_viejo,
  };
}

