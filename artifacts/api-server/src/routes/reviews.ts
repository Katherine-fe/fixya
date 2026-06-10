import { Router } from "express";
import { db } from "@workspace/db";
import { reviewsTable, usersTable, techniciansTable } from "@workspace/db";
import { eq, desc, and, avg } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const { technicianId, page = "1", limit = "20" } = req.query as Record<string, string>;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const offset = (pageNum - 1) * limitNum;

    const conditions = [];
    if (technicianId) conditions.push(eq(reviewsTable.technicianId, parseInt(technicianId)));

    const query = conditions.length > 0 ? and(...conditions) : undefined;
    const reviews = await db.select().from(reviewsTable)
      .where(query)
      .orderBy(desc(reviewsTable.createdAt))
      .limit(limitNum).offset(offset);
    const total = await db.$count(reviewsTable, query);

    const enriched = await Promise.all(reviews.map(async (r) => {
      const user = await db.query.usersTable.findFirst({ where: eq(usersTable.id, r.userId) });
      return { ...r, user };
    }));

    res.json({ reviews: enriched, total: Number(total), page: pageNum, limit: limitNum });
  } catch (err) {
    req.log.error({ err }, "Error listing reviews");
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

router.post("/", requireAuth, async (req, res) => {
  try {
    const clerkId = (req as any).clerkUserId;
    const dbUser = await db.query.usersTable.findFirst({ where: eq(usersTable.clerkId, clerkId) });
    if (!dbUser) return res.status(401).json({ error: "No autorizado" });

    const { requestId, technicianId, calificacion, comentario } = req.body;
    const [created] = await db.insert(reviewsTable).values({
      requestId,
      userId: dbUser.id,
      technicianId,
      calificacion,
      comentario,
    }).returning();

    const avgResult = await db.select({ avg: avg(reviewsTable.calificacion) })
      .from(reviewsTable)
      .where(eq(reviewsTable.technicianId, technicianId));
    const newAvg = avgResult[0]?.avg ?? "0";
    const totalCount = await db.$count(reviewsTable, eq(reviewsTable.technicianId, technicianId));
    await db.update(techniciansTable)
      .set({ promedioCalificacion: String(parseFloat(String(newAvg)).toFixed(2)), totalTrabajos: Number(totalCount) })
      .where(eq(techniciansTable.id, technicianId));

    const user = await db.query.usersTable.findFirst({ where: eq(usersTable.id, dbUser.id) });
    res.status(201).json({ ...created, user });
  } catch (err) {
    req.log.error({ err }, "Error creating review");
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const review = await db.query.reviewsTable.findFirst({ where: eq(reviewsTable.id, id) });
    if (!review) return res.status(404).json({ error: "Reseña no encontrada" });
    const user = await db.query.usersTable.findFirst({ where: eq(usersTable.id, review.userId) });
    res.json({ ...review, user });
  } catch (err) {
    req.log.error({ err }, "Error getting review");
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

export default router;
