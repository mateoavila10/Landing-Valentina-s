import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import rateLimit from "express-rate-limit";
import financesRoutes from "./routes/finances.routes.js";
import authRoutes from "./routes/auth.routes.js";
import { pool } from "./services/db.js";
import { requireAuth, requireAdmin } from "./middleware/auth.middleware.js";

dotenv.config();

if (!process.env.JWT_SECRET) {
  console.error("❌ Falta JWT_SECRET en el .env");
  process.exit(1);
}

const app = express();
app.set ("trust proxy", 1);
app.use(cors({
  origin: process.env.ALLOWED_ORIGIN || "http://localhost:5173",
}));

app.use(express.json());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);

app.use("/api/auth", authRoutes);
app.use("/api/finances", requireAuth, requireAdmin, financesRoutes);

try {
  const [rows] = await pool.query("SELECT NOW() AS now");
  console.log(`✅ Conectado a Railway | Hora: ${rows[0].now}`);
} catch (err) {
  console.error("❌ No se pudo conectar a Railway:", err.message);
}

const PORT = process.env.PORT || 4000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 API escuchando en puerto ${PORT}`);
});

export default app;