import { Router } from "express";
import {
  kpisSucursalById,
  kpisTodas,
  seriesComparativa,
} from "../services/finances.service.js";
import { pool } from "../services/db.js";
import { requireAuth } from "../middleware/auth.middleware.js";

const router = Router();

// Todas las rutas de finances requieren token válido
router.use(requireAuth);

function isValidDate(d) {
  return /^\d{4}-\d{2}-\d{2}$/.test(d) && !isNaN(Date.parse(d));
}

function validateDates(req, res) {
  const { from, to } = req.query;
  if (!from || !to) {
    res.status(400).json({ error: "Parámetros 'from' y 'to' requeridos" });
    return false;
  }
  if (!isValidDate(from) || !isValidDate(to)) {
    res.status(400).json({ error: "Formato de fecha inválido (usar YYYY-MM-DD)" });
    return false;
  }
  return true;
}

/* ──────────────────────────────────────────────
   📊 KPI POR SUCURSAL (Resumen individual)
   ────────────────────────────────────────────── */
router.get("/:id/summary", async (req, res) => {
  if (!validateDates(req, res)) return;
  try {
    const { from, to } = req.query;
    const id = Number(req.params.id);
    if (![1, 2].includes(id))
      return res.status(400).json({ error: "ID de sucursal inválido (1 o 2)" });

    const data = await kpisSucursalById({ sucursalId: id, from, to });
    res.json(data);
  } catch (err) {
    console.error("❌ Error /:id/summary:", err.message);
    res.status(500).json({ error: "Error interno al obtener resumen" });
  }
});

/* ──────────────────────────────────────────────
   📈 SERIES POR SUCURSAL
   ────────────────────────────────────────────── */
router.get("/:id/series", async (req, res) => {
  if (!validateDates(req, res)) return;
  try {
    const { id } = req.params;
    const { from, to } = req.query;
    if (![1, 2].includes(Number(id)))
      return res.status(400).json({ error: "ID de sucursal inválido (1 o 2)" });

    const Q_SERIES = `
      SELECT DATE(FechaVenta) AS dia, COALESCE(SUM(Total), 0) AS total
      FROM ventas
      WHERE id_sucursal = ?
        AND FechaVenta >= ?
        AND FechaVenta < DATE_ADD(?, INTERVAL 1 DAY)
      GROUP BY DATE(FechaVenta)
      ORDER BY dia;
    `;
    const [rows] = await pool.query(Q_SERIES, [id, from, to]);
    res.json({ sucursalId: id, ingresos: rows });
  } catch (err) {
    console.error("❌ Error en /:id/series:", err.message);
    res.status(500).json({ error: "Error al obtener series" });
  }
});

/* ──────────────────────────────────────────────
   🧮 KPI GENERAL (Centro + Tafí Viejo)
   ────────────────────────────────────────────── */
router.get("/summary", async (req, res) => {
  if (!validateDates(req, res)) return;
  try {
    const { from, to } = req.query;
    const data = await kpisTodas({ from, to });
    res.json(data);
  } catch (err) {
    console.error("❌ Error interno en /summary:", err.message);
    res.status(500).json({ error: "Error al obtener resumen" });
  }
});

/* ──────────────────────────────────────────────
   📊 SERIES COMPARATIVAS (ambas sucursales)
   ────────────────────────────────────────────── */
router.get("/series", async (req, res) => {
  if (!validateDates(req, res)) return;
  try {
    const { from, to } = req.query;
    const data = await seriesComparativa({ from, to });
    res.json(data);
  } catch (err) {
    console.error("❌ Error interno en /series:", err.message);
    res.status(500).json({ error: "Error al obtener series" });
  }
});

export default router;
