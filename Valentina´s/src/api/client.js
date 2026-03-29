const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000";

/* ──────────────────────────────────────────────
   📌 Helpers por sucursal (1 = Centro, 2 = Tafí)
   ────────────────────────────────────────────── */

// Resumen de una sucursal por ID
export async function fetchSucursalSummary(id, { from, to }) {
  const qs = new URLSearchParams({ from, to }).toString();
  const res = await fetch(`${API_BASE}/api/finances/${id}/summary?${qs}`);
  if (!res.ok) throw new Error(`Error ${res.status}`);
  return res.json(); // { sucursalId, nombre, ingresos, egresos, balance }
}

// Series de una sucursal por ID (si las llegás a usar)
export async function fetchSucursalSeries(id, { from, to }) {
  const qs = new URLSearchParams({ from, to }).toString();
  const res = await fetch(`${API_BASE}/api/finances/${id}/series?${qs}`);
  if (!res.ok) throw new Error(`Error ${res.status}`);
  const json = await res.json(); // { sucursalId, ingresos: [...] }
  return { sucursalId: json.sucursalId, series: json.ingresos || [] };
}

/* ──────────────────────────────────────────────
   📈 Series de ambas sucursales
   ────────────────────────────────────────────── */

// 🔹 Esta es la que te está pidiendo App.jsx
// Firma: fetchSeriesAmbas({ from, to })
export async function fetchSeriesAmbas({ from, to }) {
  return getSeries(from, to); // reutilizamos la función nueva de abajo
}

/* ──────────────────────────────────────────────
   📊 Resumen combinado (por si lo querés usar aparte)
   ────────────────────────────────────────────── */

export async function fetchResumenAmbas({ from, to }) {
  const [r1, r2] = await Promise.all([
    fetchSucursalSummary(1, { from, to }),
    fetchSucursalSummary(2, { from, to }),
  ]);

  const centro = {
    ingresos: r1.ingresos,
    egresos:  r1.egresos,
    balance:  r1.balance,
  };

  const tafi_viejo = {
    ingresos: r2.ingresos,
    egresos:  r2.egresos,
    balance:  r2.balance,
  };

  const total = {
    ingresos: (r1.ingresos || 0) + (r2.ingresos || 0),
    egresos:  (r1.egresos  || 0) + (r2.egresos  || 0),
    balance:  (r1.balance  || 0) + (r2.balance  || 0),
  };

  return { centro, tafi_viejo, total };
}

/* ──────────────────────────────────────────────
   🔹 Funciones que usa tu Dashboard.jsx
   ────────────────────────────────────────────── */

// Resumen general (lo importás como getSummary)
export async function getSummary(from, to) {
  const qs = new URLSearchParams({ from, to }).toString();
  const res = await fetch(`${API_BASE}/api/finances/summary?${qs}`);
  if (!res.ok) throw new Error(`Error ${res.status}`);
  const json = await res.json(); // { rango, sucursales: { centro, tafi_viejo }, total, ... }

  const centro    = json.sucursales?.centro || {};
  const tafi      = json.sucursales?.tafi_viejo || {};
  const totalCalc = json.total || {
    ingresos: (centro.ingresos || 0) + (tafi.ingresos || 0),
    egresos:  (centro.egresos  || 0) + (tafi.egresos  || 0),
    balance:  (centro.balance  || 0) + (tafi.balance  || 0),
  };

  return {
    ...json,
    sucursales: {
      ...json.sucursales,
      // lo que usa BalanceCards:
      sucursal1: centro,
      sucursal2: tafi,
      central: {
        nombre: "Central",
        ingresos: totalCalc.ingresos,
        egresos:  totalCalc.egresos,
        balance:  totalCalc.balance,
      },
    },
    total: totalCalc,
  };
}

// Series comparativas (lo importás como getSeries)
export async function getSeries(from, to) {
  const qs = new URLSearchParams({ from, to }).toString();
  const res = await fetch(`${API_BASE}/api/finances/series?${qs}`);
  if (!res.ok) throw new Error(`Error ${res.status}`);
  const json = await res.json();
  // json ya viene en formato que espera LineChartSerie:
  // { centro: { ingresos:[...], egresos:[...] }, tafi_viejo: {...}, sucursal1, sucursal2 }
  return json;
}
