import { Router } from "express";
import jwt from "jsonwebtoken";
import { findUserByUsername, validatePassword } from "../services/auth.service.js";

const router = Router();

router.post("/login", async (req, res) => {
  try {
    const { usuario, password } = req.body;

    if (!usuario || !password) {
      return res.status(400).json({ error: "Usuario y contraseña requeridos" });
    }

    const user = await findUserByUsername(usuario.trim());

    if (!user) {
      return res.status(401).json({ error: "Credenciales incorrectas" });
    }

    if (Number(user.is_deleted) === 1) {
      return res.status(401).json({ error: "Usuario inactivo" });
    }

    if (String(user.estado || "").toLowerCase() !== "activo") {
      return res.status(401).json({ error: "Usuario inactivo" });
    }

    const valid = await validatePassword(password, user.password_hash);

    if (!valid) {
      return res.status(401).json({ error: "Credenciales incorrectas" });
    }

    if (String(user.rol || "").toLowerCase() !== "admin") {
      return res.status(403).json({ error: "Acceso denegado. Solo Admin puede ingresar." });
    }

    const token = jwt.sign(
      {
        id: user.id,
        usuario: user.usuario,
        nombre: user.nombre,
        rol: user.rol,
        id_sucursal: user.id_sucursal,
      },
      process.env.JWT_SECRET,
      { expiresIn: "8h" }
    );

    return res.json({
      token,
      user: {
        id: user.id,
        nombre: user.nombre,
        usuario: user.usuario,
        rol: user.rol,
        id_sucursal: user.id_sucursal,
      },
    });
  } catch (err) {
    console.error("❌ Error en /api/auth/login:");
    console.error(err);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
});

export default router;