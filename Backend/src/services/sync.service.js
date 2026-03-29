import { poolDB1, poolDB2, poolDBC } from "../db.js";

// Ejecuta cada cierto tiempo (ej. 5 min)
export async function sincronizarDatos() {
  console.log("🔄 Iniciando sincronización automática...");

  try {
    // Leer ventas de Sucursal 1
    const [ventas1] = await poolDB1.query("SELECT * FROM ventas");
    // Leer ventas de Sucursal 2
    const [ventas2] = await poolDB2.query("SELECT * FROM ventas");

    const todas = [...ventas1, ...ventas2];

    for (const venta of todas) {
      // Evitar duplicados: usa IdVenta como referencia
      await poolDBC.query(
        `INSERT INTO ventas (IdVenta, FechaVenta, Total)
         VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE FechaVenta = VALUES(FechaVenta), Total = VALUES(Total);`,
        [venta.IdVenta, venta.FechaVenta, venta.Total]
      );
    }

    console.log(`✅ ${todas.length} ventas sincronizadas correctamente`);
  } catch (err) {
    console.error("❌ Error durante la sincronización:", err.message);
  }
}
