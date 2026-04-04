/**
 * Crea el usuario administrador inicial en la base de datos.
 *
 * Uso:
 *   cd Backend
 *   node database/seed.js
 *
 * Cambiá ADMIN_USUARIO y ADMIN_PASSWORD antes de correrlo en producción.
 */

import bcrypt from "bcryptjs";
import { pool } from "../src/services/db.js";

const ADMIN_USUARIO  = "admin";
const ADMIN_PASSWORD = "valentinas2025";
const ADMIN_NOMBRE   = "Administrador";

const hash = await bcrypt.hash(ADMIN_PASSWORD, 10);

await pool.query(
  `INSERT INTO usuarios (usuario, password_hash, nombre, rol)
   VALUES (?, ?, ?, 'admin')
   ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash), nombre = VALUES(nombre)`,
  [ADMIN_USUARIO, hash, ADMIN_NOMBRE]
);

console.log("✅ Usuario admin creado/actualizado:");
console.log(`   Usuario:    ${ADMIN_USUARIO}`);
console.log(`   Contraseña: ${ADMIN_PASSWORD}`);
console.log("⚠️  Cambiá la contraseña luego de iniciar sesión por primera vez.");

await pool.end();
process.exit(0);
