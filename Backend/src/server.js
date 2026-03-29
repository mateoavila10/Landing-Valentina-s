import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import financesRoutes from "./routes/finances.routes.js";
import { pool } from "./services/db.js";

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

// ✅ Prefijo correcto para las rutas
app.use("/api/finances", financesRoutes);

// Prueba conexión
try {
  const [rows] = await pool.query("SELECT NOW() AS now");
  console.log(`✅ Conectado a railway | Hora: ${rows[0].now}`);
} catch (err) {
  console.error("❌ No se pudo conectar a Railway:", err.message);
}

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`🚀 API escuchando en puerto ${PORT}`));
export default app;