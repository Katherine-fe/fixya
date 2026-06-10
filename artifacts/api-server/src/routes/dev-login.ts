import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

const DEV_USERS: Record<string, { clerkId: string; nombre: string; apellido: string; email: string; role: "usuario" | "tecnico" | "administrador" }> = {
  admin: {
    clerkId: "dev_admin_fixya",
    nombre: "Admin",
    apellido: "FixYa",
    email: "admin@fixya.pe",
    role: "administrador",
  },
  tecnico: {
    clerkId: "dev_tecnico_fixya",
    nombre: "Carlos",
    apellido: "Técnico",
    email: "tecnico@fixya.pe",
    role: "tecnico",
  },
  usuario: {
    clerkId: "dev_usuario_fixya",
    nombre: "María",
    apellido: "Cliente",
    email: "cliente@fixya.pe",
    role: "usuario",
  },
};

router.post("/login", async (req, res) => {
  if (process.env.NODE_ENV === "production") {
    res.status(403).json({ error: "No disponible en producción" });
    return;
  }

  const { role } = req.body as { role?: string };
  const devUser = role ? DEV_USERS[role] : null;

  if (!devUser) {
    res.status(400).json({ error: "Rol inválido. Usa: admin, tecnico, usuario" });
    return;
  }

  try {
    let user = await db.query.usersTable.findFirst({
      where: eq(usersTable.clerkId, devUser.clerkId),
    });

    if (!user) {
      // Check if a user with the same email exists (from previous Clerk signup attempts)
      const existing = await db.query.usersTable.findFirst({
        where: eq(usersTable.email, devUser.email),
      });
      if (existing) {
        // Take over that user record for dev purposes
        const [updated] = await db.update(usersTable)
          .set({ clerkId: devUser.clerkId, role: devUser.role, activo: true })
          .where(eq(usersTable.email, devUser.email))
          .returning();
        user = updated;
      } else {
        const [created] = await db.insert(usersTable).values({
          clerkId: devUser.clerkId,
          nombre: devUser.nombre,
          apellido: devUser.apellido,
          email: devUser.email,
          role: devUser.role,
          activo: true,
        }).returning();
        user = created;
      }
    } else if (user.role !== devUser.role) {
      const [updated] = await db.update(usersTable)
        .set({ role: devUser.role })
        .where(eq(usersTable.clerkId, devUser.clerkId))
        .returning();
      user = updated;
    }

    (req.session as any).devClerkId = devUser.clerkId;
    req.log.info({ role: devUser.role }, "Dev login successful");
    res.json({ ok: true, user });
  } catch (err) {
    req.log.error({ err }, "Dev login error");
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

router.post("/logout", (req, res) => {
  req.session.destroy(() => {
    res.json({ ok: true });
  });
});

export default router;
