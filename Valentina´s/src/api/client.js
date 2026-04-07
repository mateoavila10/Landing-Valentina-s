const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000";

function getToken() {
  return localStorage.getItem("vlt_token");
}

async function apiFetch(url, options = {}) {
  const token = getToken();
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (res.status === 401) {
    localStorage.removeItem("vlt_token");
    localStorage.removeItem("vlt_user");
    window.location.href = "/login";
    throw new Error("Sesión expirada. Ingresá nuevamente.");
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Error ${res.status}`);
  }

  return res.json();
}

/* ──────────────────────────────────────────────
   📊 Resumen general (ambas sucursales)
   ────────────────────────────────────────────── */
export async function getSummary(from, to) {
  const qs = new URLSearchParams({ from, to }).toString();
  const json = await apiFetch(`${API_BASE}/api/finances/summary?${qs}`);

  const centro = json.sucursales?.centro || {};
  const tafi   = json.sucursales?.tafi_viejo || {};
  const totalCalc = json.total || {
    ingresos: (centro.ingresos || 0) + (tafi.ingresos || 0),
    egresos:  (centro.egresos  || 0) + (tafi.egresos  || 0),
    balance:  (centro.balance  || 0) + (tafi.balance  || 0),
  };

  return {
    ...json,
    sucursales: {
      ...json.sucursales,
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

/* ──────────────────────────────────────────────
   📈 Series comparativas (gráficos)
   ────────────────────────────────────────────── */
export async function getSeries(from, to) {
  const qs = new URLSearchParams({ from, to }).toString();
  return apiFetch(`${API_BASE}/api/finances/series?${qs}`);
}

/* ──────────────────────────────────────────────
   🛒 Ventas — resumen y series
   ────────────────────────────────────────────── */
export async function getSalesSummary(from, to) {
  const qs = new URLSearchParams({ from, to }).toString();
  return apiFetch(`${API_BASE}/api/finances/sales/summary?${qs}`);
}

export async function getSalesSeries(from, to) {
  const qs = new URLSearchParams({ from, to }).toString();
  return apiFetch(`${API_BASE}/api/finances/sales/series?${qs}`);
}

/* ──────────────────────────────────────────────
   📌 Por sucursal individual (uso opcional)
   ────────────────────────────────────────────── */
export async function fetchSucursalSummary(id, { from, to }) {
  const qs = new URLSearchParams({ from, to }).toString();
  return apiFetch(`${API_BASE}/api/finances/${id}/summary?${qs}`);
}
