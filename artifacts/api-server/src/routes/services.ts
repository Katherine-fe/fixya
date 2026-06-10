import { Router } from "express";
import { db } from "@workspace/db";
import { servicesTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const services = await db.select().from(servicesTable)
      .where(eq(servicesTable.activo, true))
      .orderBy(servicesTable.nombre);
    res.json(services);
  } catch (err) {
    req.log.error({ err }, "Error listing services");
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

router.post("/", requireAuth, async (req, res) => {
  try {
    const { nombre, descripcion, icono, precioBase } = req.body;
    const [created] = await db.insert(servicesTable).values({
      nombre,
      descripcion,
      icono,
      precioBase: String(precioBase ?? 0),
    }).returning();
    res.status(201).json(created);
  } catch (err) {
    req.log.error({ err }, "Error creating service");
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const service = await db.query.servicesTable.findFirst({ where: eq(servicesTable.id, id) });
    if (!service) return res.status(404).json({ error: "Servicio no encontrado" });
    res.json(service);
  } catch (err) {
    req.log.error({ err }, "Error getting service");
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

router.patch("/:id", requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { nombre, descripcion, icono, precioBase, activo } = req.body;
    const [updated] = await db.update(servicesTable)
      .set({
        ...(nombre !== undefined && { nombre }),
        ...(descripcion !== undefined && { descripcion }),
        ...(icono !== undefined && { icono }),
        ...(precioBase !== undefined && { precioBase: String(precioBase) }),
        ...(activo !== undefined && { activo }),
      })
      .where(eq(servicesTable.id, id))
      .returning();
    if (!updated) return res.status(404).json({ error: "Servicio no encontrado" });
    res.json(updated);
  } catch (err) {
    req.log.error({ err }, "Error updating service");
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

router.delete("/:id", requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.update(servicesTable).set({ activo: false }).where(eq(servicesTable.id, id));
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Error deleting service");
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

export default router;
