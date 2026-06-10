import { Router } from "express";
import bcrypt from "bcryptjs";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { signToken } from "../lib/jwt";
import { requireAuth } from "../middlewares/auth";

const router = Router();

function safeUser(user: any) {
  const { passwordHash: _, clerkId: __, ...safe } = user;
  return safe;
}

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email y contraseña son requeridos" });
    }

    const user = await db.query.usersTable.findFirst({
      where: eq(usersTable.email, email.toLowerCase().trim()),
    });

    if (!user || !user.passwordHash) {
      return res.status(401).json({ error: "Credenciales inválidas" });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: "Credenciales inválidas" });
    }

    if (!user.activo) {
      return res.status(403).json({ error: "Cuenta desactivada. Contacta al soporte." });
    }

    const token = signToken({ sub: user.id, email: user.email, role: user.role });
    res.json({ token, user: safeUser(user) });
  } catch (err) {
    req.log.error({ err }, "Error en login");
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

router.post("/register", async (req, res) => {
  try {
    const { nombre, apellido, email, password, telefono } = req.body;
    if (!nombre || !email || !password) {
      return res.status(400).json({ error: "Nombre, email y contraseña son requeridos" });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: "La contraseña debe tener al menos 6 caracteres" });
    }

    const existing = await db.query.usersTable.findFirst({
      where: eq(usersTable.email, email.toLowerCase().trim()),
    });
    if (existing) {
      return res.status(409).json({ error: "Ya existe una cuenta con ese correo electrónico" });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const [user] = await db.insert(usersTable).values({
      nombre: nombre.trim(),
      apellido: (apellido || "").trim(),
      email: email.toLowerCase().trim(),
      telefono: telefono || null,
      passwordHash,
      role: "usuario",
      activo: true,
    }).returning();

    const token = signToken({ sub: user.id, email: user.email, role: user.role });
    res.status(201).json({ token, user: safeUser(user) });
  } catch (err) {
    req.log.error({ err }, "Error en registro");
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

router.get("/me", requireAuth, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const user = await db.query.usersTable.findFirst({ where: eq(usersTable.id, userId) });
    if (!user) return res.status(404).json({ error: "Usuario no encontrado" });
    res.json(safeUser(user));
  } catch (err) {
    req.log.error({ err }, "Error obteniendo usuario actual");
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

export default router;
