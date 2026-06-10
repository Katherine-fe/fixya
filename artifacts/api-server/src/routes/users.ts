import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";

const router = Router();

function safeUser(user: any) {
  const { passwordHash: _, clerkId: __, ...safe } = user;
  return safe;
}

router.get("/me", requireAuth, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const user = await db.query.usersTable.findFirst({ where: eq(usersTable.id, userId) });
    if (!user) return res.status(404).json({ error: "Usuario no encontrado" });
    res.json(safeUser(user));
  } catch (err) {
    req.log.error({ err }, "Error obteniendo perfil de usuario");
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

router.patch("/me", requireAuth, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const { nombre, apellido, telefono, direccion, avatarUrl } = req.body;
    const [updated] = await db.update(usersTable)
      .set({
        ...(nombre !== undefined && { nombre }),
        ...(apellido !== undefined && { apellido }),
        ...(telefono !== undefined && { telefono }),
        ...(direccion !== undefined && { direccion }),
        ...(avatarUrl !== undefined && { avatarUrl }),
      })
      .where(eq(usersTable.id, userId))
      .returning();
    if (!updated) return res.status(404).json({ error: "Usuario no encontrado" });
    res.json(safeUser(updated));
  } catch (err) {
    req.log.error({ err }, "Error actualizando usuario");
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

router.get("/", requireAuth, async (req, res) => {
  try {
    const { role, page = "1", limit = "20" } = req.query as Record<string, string>;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const offset = (pageNum - 1) * limitNum;

    if (role) {
      const users = await db.select().from(usersTable)
        .where(eq(usersTable.role, role as any))
        .orderBy(desc(usersTable.createdAt))
        .limit(limitNum).offset(offset);
      const total = await db.$count(usersTable, eq(usersTable.role, role as any));
      return res.json({ users: users.map(safeUser), total: Number(total), page: pageNum, limit: limitNum });
    }
    const users = await db.select().from(usersTable)
      .orderBy(desc(usersTable.createdAt))
      .limit(limitNum).offset(offset);
    const total = await db.$count(usersTable);
    res.json({ users: users.map(safeUser), total: Number(total), page: pageNum, limit: limitNum });
  } catch (err) {
    req.log.error({ err }, "Error listando usuarios");
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

router.get("/:id", requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const user = await db.query.usersTable.findFirst({ where: eq(usersTable.id, id) });
    if (!user) return res.status(404).json({ error: "Usuario no encontrado" });
    res.json(safeUser(user));
  } catch (err) {
    req.log.error({ err }, "Error obteniendo usuario");
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

router.patch("/:id", requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { role, activo } = req.body;
    const [updated] = await db.update(usersTable)
      .set({
        ...(role !== undefined && { role }),
        ...(activo !== undefined && { activo }),
      })
      .where(eq(usersTable.id, id))
      .returning();
    if (!updated) return res.status(404).json({ error: "Usuario no encontrado" });
    res.json(safeUser(updated));
  } catch (err) {
    req.log.error({ err }, "Error actualizando usuario");
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

export default router;
