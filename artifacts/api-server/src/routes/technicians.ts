import { Router } from "express";
import { db } from "@workspace/db";
import { techniciansTable, usersTable, servicesTable } from "@workspace/db";
import { eq, desc, and } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";

const router = Router();

async function enrichTechnician(tech: any) {
  const user = await db.query.usersTable.findFirst({ where: eq(usersTable.id, tech.userId) });
  const service = await db.query.servicesTable.findFirst({ where: eq(servicesTable.id, tech.serviceId) });
  return {
    ...tech,
    promedioCalificacion: parseFloat(tech.promedioCalificacion ?? "0"),
    precioHora: parseFloat(tech.precioHora ?? "0"),
    user,
    service,
  };
}

router.get("/top", async (req, res) => {
  try {
    const limit = parseInt((req.query.limit as string) ?? "6");
    const techs = await db.select().from(techniciansTable)
      .where(eq(techniciansTable.status, "aprobado"))
      .orderBy(desc(techniciansTable.promedioCalificacion))
      .limit(limit);
    const enriched = await Promise.all(techs.map(enrichTechnician));
    res.json(enriched);
  } catch (err) {
    req.log.error({ err }, "Error obteniendo top técnicos");
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

router.get("/me", requireAuth, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const tech = await db.query.techniciansTable.findFirst({ where: eq(techniciansTable.userId, userId) });
    if (!tech) return res.status(404).json({ error: "Perfil de técnico no encontrado" });
    res.json(await enrichTechnician(tech));
  } catch (err) {
    req.log.error({ err }, "Error obteniendo perfil de técnico");
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

router.post("/me", requireAuth, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const { serviceId, especialidad, descripcion, experienciaAnios, precioHora } = req.body;
    const [created] = await db.insert(techniciansTable).values({
      userId,
      serviceId,
      especialidad,
      descripcion,
      experienciaAnios,
      precioHora: String(precioHora),
      status: "pendiente",
    }).returning();
    await db.update(usersTable).set({ role: "tecnico" }).where(eq(usersTable.id, userId));
    res.status(201).json(await enrichTechnician(created));
  } catch (err) {
    req.log.error({ err }, "Error creando perfil de técnico");
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

router.patch("/me", requireAuth, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const tech = await db.query.techniciansTable.findFirst({ where: eq(techniciansTable.userId, userId) });
    if (!tech) return res.status(404).json({ error: "Perfil de técnico no encontrado" });
    const { especialidad, descripcion, experienciaAnios, precioHora, disponible } = req.body;
    const [updated] = await db.update(techniciansTable)
      .set({
        ...(especialidad !== undefined && { especialidad }),
        ...(descripcion !== undefined && { descripcion }),
        ...(experienciaAnios !== undefined && { experienciaAnios }),
        ...(precioHora !== undefined && { precioHora: String(precioHora) }),
        ...(disponible !== undefined && { disponible }),
      })
      .where(eq(techniciansTable.id, tech.id))
      .returning();
    res.json(await enrichTechnician(updated));
  } catch (err) {
    req.log.error({ err }, "Error actualizando perfil de técnico");
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

router.get("/", async (req, res) => {
  try {
    const { serviceId, status, page = "1", limit = "20" } = req.query as Record<string, string>;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const offset = (pageNum - 1) * limitNum;

    const conditions = [];
    if (serviceId) conditions.push(eq(techniciansTable.serviceId, parseInt(serviceId)));
    if (status) conditions.push(eq(techniciansTable.status, status as any));

    const query = conditions.length > 0 ? and(...conditions) : undefined;
    const techs = await db.select().from(techniciansTable)
      .where(query)
      .orderBy(desc(techniciansTable.promedioCalificacion))
      .limit(limitNum).offset(offset);
    const total = await db.$count(techniciansTable, query);
    const enriched = await Promise.all(techs.map(enrichTechnician));
    res.json({ technicians: enriched, total: Number(total), page: pageNum, limit: limitNum });
  } catch (err) {
    req.log.error({ err }, "Error listando técnicos");
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const tech = await db.query.techniciansTable.findFirst({ where: eq(techniciansTable.id, id) });
    if (!tech) return res.status(404).json({ error: "Técnico no encontrado" });
    res.json(await enrichTechnician(tech));
  } catch (err) {
    req.log.error({ err }, "Error obteniendo técnico");
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

router.post("/:id/approve", requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [updated] = await db.update(techniciansTable)
      .set({ status: "aprobado" })
      .where(eq(techniciansTable.id, id))
      .returning();
    if (!updated) return res.status(404).json({ error: "Técnico no encontrado" });
    res.json(await enrichTechnician(updated));
  } catch (err) {
    req.log.error({ err }, "Error aprobando técnico");
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

router.post("/:id/reject", requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [updated] = await db.update(techniciansTable)
      .set({ status: "rechazado" })
      .where(eq(techniciansTable.id, id))
      .returning();
    if (!updated) return res.status(404).json({ error: "Técnico no encontrado" });
    res.json(await enrichTechnician(updated));
  } catch (err) {
    req.log.error({ err }, "Error rechazando técnico");
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

export default router;
