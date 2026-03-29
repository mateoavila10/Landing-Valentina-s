import { Router } from "express";
import {
  kpisSucursalById,
  kpisTodas,
  seriesComparativa
} from "../services/finances.service.js";
import { pool } from "../services/db.js";

const router = Router();

/* ──────────────────────────────────────────────
   📊 KPI POR SUCURSAL (Resumen individual)
   ────────────────────────────────────────────── */
router.get("/:id/summary", async (req, res) => {
  try {
    const { from, to } = req.query;
    const id = Number(req.params.id);

    if (!from || !to)
      return res.status(400).json({ error: "Parámetros 'from' y 'to' requeridos" });
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
   📈 SERIES POR SUCURSAL (compatibilidad con el front)
   ────────────────────────────────────────────── */
router.get("/:id/series", async (req, res) => {
  try {
    const { id } = req.params;
    const { from, to } = req.query;

    if (!from || !to)
      return res.status(400).json({ error: "Parámetros 'from' y 'to' requeridos" });
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
  try {
    const { from, to } = req.query;
    if (!from || !to)
      return res.status(400).json({ error: "Parámetros 'from' y 'to' requeridos" });

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
  try {
    const { from, to } = req.query;
    if (!from || !to)
      return res.status(400).json({ error: "Parámetros 'from' y 'to' requeridos" });

    const data = await seriesComparativa({ from, to });
    res.json(data);
  } catch (err) {
    console.error("❌ Error interno en /series:", err.message);
    res.status(500).json({ error: "Error al obtener series" });
  }
});

export default router;
