import mysql from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config();

function required(name) {
  const val = process.env[name];
  if (!val) throw new Error(`Falta variable ${name} en .env`);
  return val;
}

const cfg = {
  host: required("DB_HOST"),
  port: Number(process.env.DB_PORT || 3306),
  user: required("DB_USER"),
  password: required("DB_PASS"),
  database: required("DB_NAME"),
  waitForConnections: true,
  connectionLimit: 10,
  connectTimeout: 20000,
  timezone: "-03:00",
  ssl: {
    rejectUnauthorized: false, // 👈 acepta certificados autofirmados
  },
};


export const pool = mysql.createPool(cfg);

(async () => {
  try {
    const [rows] = await pool.query("SELECT DATABASE() AS db, NOW() AS hora");
    console.log(`✅ Conectado a ${rows[0].db} | Hora: ${rows[0].hora}`);
  } catch (err) {
    console.error("❌ No se pudo conectar a Railway:", err.message);
  }
})();
