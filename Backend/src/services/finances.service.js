import { pool } from "./db.js";

/* ──────────────────────────────────────────────
   🛒 DETALLE VENTAS - Resumen por sucursal
   ────────────────────────────────────────────── */
export async function detalleVentasSummary({ from, to }) {
  const Q = `
    SELECT
      v.id_sucursal,
      COUNT(dv.IdDetalle)          AS items,
      COALESCE(SUM(dv.SubTotal), 0) AS subtotal
    FROM detalleventa dv
    JOIN ventas v ON dv.IdVenta = v.IdVenta
    WHERE v.FechaVenta >= ?
      AND v.FechaVenta < DATE_ADD(?, INTERVAL 1 DAY)
      AND dv.IsDeleted = 0
      AND v.IsDeleted  = 0
    GROUP BY v.id_sucursal
  `;
  const [rows] = await pool.query(Q, [from, to]);

  const centro = rows.find((r) => r.id_sucursal === 1) || { items: 0, subtotal: 0 };
  const tafi   = rows.find((r) => r.id_sucursal === 2) || { items: 0, subtotal: 0 };

  return {
    centro:     { nombre: "Centro",     items: Number(centro.items),   subtotal: Number(centro.subtotal) },
    tafi_viejo: { nombre: "Tafí Viejo", items: Number(tafi.items),     subtotal: Number(tafi.subtotal)   },
    total:      { items: Number(centro.items) + Number(tafi.items), subtotal: Number(centro.subtotal) + Number(tafi.subtotal) },
  };
}

/* ──────────────────────────────────────────────
   🛒 DETALLE VENTAS - Listado de líneas
   ────────────────────────────────────────────── */
export async function detalleVentasLista({ from, to }) {
  const Q = `
    SELECT
      dv.IdDetalle,
      CONCAT_WS(' ', p.articulo_local, p.articulo_marca, p.modelo) AS producto,
      dv.Talle,
      dv.Cantidad,
      dv.PrecioVidriera,
      dv.SubTotal,
      v.FechaVenta,
      CONCAT_WS(' ', e.NombreCompleto, e.Apellido)                 AS empleado,
      v.MetodoPago,
      v.id_sucursal
    FROM detalleventa dv
    JOIN  ventas    v ON dv.IdVenta   = v.IdVenta
    LEFT JOIN productos p ON dv.IdProducto = p.id_producto
    LEFT JOIN empleados e ON v.IdEmpleado  = e.IdEmpleado
    WHERE v.FechaVenta >= ?
      AND v.FechaVenta < DATE_ADD(?, INTERVAL 1 DAY)
      AND dv.IsDeleted = 0
      AND v.IsDeleted  = 0
    ORDER BY v.FechaVenta DESC
    LIMIT 500
  `;
  const [rows] = await pool.query(Q, [from, to]);
  return rows.map((r) => ({
    ...r,
    sucursal: r.id_sucursal === 1 ? "Centro" : "Tafí Viejo",
  }));
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

