import crypto from "crypto";
import bcrypt from "bcryptjs";
import { pool } from "./db.js";

export async function findUserByUsername(usuario) {
  const sql = `
    SELECT
      IdEmpleado      AS id,
      NombreCompleto  AS nombre,
      Usuario         AS usuario,
      Password_hash   AS password_hash,
      Rol             AS rol,
      Estado          AS estado,
      IsDeleted       AS is_deleted,
      id_sucursal     AS id_sucursal
    FROM empleados
    WHERE Usuario = ?
    LIMIT 1
  `;

  const [rows] = await pool.query(sql, [usuario]);
  return rows[0] || null;
}

function sha256(texto) {
  return crypto.createHash("sha256").update(texto, "utf8").digest("hex");
}

export async function validatePassword(passwordIngresada, passwordGuardada) {
  if (!passwordGuardada) return false;

  const stored = String(passwordGuardada).trim();
  const plain = String(passwordIngresada ?? "");

  // 1) compatibilidad si llegara a estar guardada en texto plano
  if (plain === stored) return true;

  // 2) compatibilidad con SHA256 (muy probable en tu sistema WinForms)
  const sha = sha256(plain);
  if (sha.toLowerCase() === stored.toLowerCase()) return true;

  // 3) compatibilidad con bcrypt si algún usuario nuevo fue creado así
  if (
    stored.startsWith("$2a$") ||
    stored.startsWith("$2b$") ||
    stored.startsWith("$2y$")
  ) {
    return await bcrypt.compare(plain, stored);
  }

  return false;
}