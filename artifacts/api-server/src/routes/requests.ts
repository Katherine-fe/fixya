import { Router } from "express";
import { db } from "@workspace/db";
import {
  serviceRequestsTable, usersTable, techniciansTable, servicesTable, offersTable,
} from "@workspace/db";
import { eq, desc, and, isNull, or, ne } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";

const router = Router();

async function enrichRequest(req_: any) {
  const user = req_.userId
    ? await db.query.usersTable.findFirst({ where: eq(usersTable.id, req_.userId) })
    : null;
  let technician = null;
  if (req_.technicianId) {
    const tech = await db.query.techniciansTable.findFirst({ where: eq(techniciansTable.id, req_.technicianId) });
    if (tech) {
      const techUser = await db.query.usersTable.findFirst({ where: eq(usersTable.id, tech.userId) });
      const techService = await db.query.servicesTable.findFirst({ where: eq(servicesTable.id, tech.serviceId) });
      technician = {
        ...tech,
        promedioCalificacion: parseFloat(tech.promedioCalificacion ?? "0"),
        precioHora: parseFloat(tech.precioHora ?? "0"),
        user: techUser,
        service: techService,
      };
    }
  }
  const service = req_.serviceId
    ? await db.query.servicesTable.findFirst({ where: eq(servicesTable.id, req_.serviceId) })
    : null;
  return {
    ...req_,
    precioAcordado: req_.precioAcordado ? parseFloat(req_.precioAcordado) : null,
    user,
    technician,
    service,
  };
}

async function enrichOffer(offer: any) {
  const tech = await db.query.techniciansTable.findFirst({ where: eq(techniciansTable.id, offer.technicianId) });
  let techUser = null;
  let techService = null;
  if (tech) {
    techUser = await db.query.usersTable.findFirst({ where: eq(usersTable.id, tech.userId) });
    techService = await db.query.servicesTable.findFirst({ where: eq(servicesTable.id, tech.serviceId) });
  }
  return {
    ...offer,
    monto: parseFloat(offer.monto),
    technician: tech ? {
      ...tech,
      promedioCalificacion: parseFloat(tech.promedioCalificacion ?? "0"),
      precioHora: parseFloat(tech.precioHora ?? "0"),
      user: techUser,
      service: techService,
    } : null,
  };
}

// GET /public — open requests (no technician assigned, pending) visible to technicians
router.get("/public", requireAuth, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const userRole = (req as any).userRole;
    const { serviceId, page = "1", limit = "20" } = req.query as Record<string, string>;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const offset = (pageNum - 1) * limitNum;

    const conditions: any[] = [
      eq(serviceRequestsTable.status, "pendiente"),
      isNull(serviceRequestsTable.technicianId),
    ];

    // Technicians see requests matching their service, or all services if no filter
    if (userRole === "tecnico" && serviceId) {
      conditions.push(eq(serviceRequestsTable.serviceId, parseInt(serviceId)));
    }

    const query = and(...conditions);
    const requests = await db.select().from(serviceRequestsTable)
      .where(query)
      .orderBy(desc(serviceRequestsTable.createdAt))
      .limit(limitNum).offset(offset);
    const total = await db.$count(serviceRequestsTable, query);
    const enriched = await Promise.all(requests.map(enrichRequest));

    // For each request, count existing offers
    const withOfferCounts = await Promise.all(enriched.map(async (r) => {
      const offerCount = Number(await db.$count(offersTable, eq(offersTable.requestId, r.id)));
      // Check if this technician already made an offer
      let myOffer = null;
      if (userRole === "tecnico") {
        const tech = await db.query.techniciansTable.findFirst({ where: eq(techniciansTable.userId, userId) });
        if (tech) {
          myOffer = await db.query.offersTable.findFirst({
            where: and(eq(offersTable.requestId, r.id), eq(offersTable.technicianId, tech.id)),
          });
          if (myOffer) myOffer = { ...myOffer, monto: parseFloat(myOffer.monto) };
        }
      }
      return { ...r, offerCount, myOffer };
    }));

    res.json({ requests: withOfferCounts, total: Number(total), page: pageNum, limit: limitNum });
  } catch (err) {
    req.log.error({ err }, "Error listando solicitudes públicas");
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// GET / — user's own requests
router.get("/", requireAuth, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const userRole = (req as any).userRole;
    const { status, page = "1", limit = "20" } = req.query as Record<string, string>;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const offset = (pageNum - 1) * limitNum;

    const conditions = [];
    if (status) conditions.push(eq(serviceRequestsTable.status, status as any));

    if (userRole === "usuario") {
      conditions.push(eq(serviceRequestsTable.userId, userId));
    } else if (userRole === "tecnico") {
      const tech = await db.query.techniciansTable.findFirst({ where: eq(techniciansTable.userId, userId) });
      if (tech) conditions.push(eq(serviceRequestsTable.technicianId, tech.id));
    }

    const query = conditions.length > 0 ? and(...conditions) : undefined;
    const requests = await db.select().from(serviceRequestsTable)
      .where(query)
      .orderBy(desc(serviceRequestsTable.createdAt))
      .limit(limitNum).offset(offset);
    const total = await db.$count(serviceRequestsTable, query);
    const enriched = await Promise.all(requests.map(enrichRequest));

    // For usuario: attach offer count to each request
    const withMeta = userRole === "usuario"
      ? await Promise.all(enriched.map(async (r) => {
          const offerCount = Number(await db.$count(offersTable, and(
            eq(offersTable.requestId, r.id),
            eq(offersTable.status, "pendiente"),
          )));
          return { ...r, offerCount };
        }))
      : enriched;

    res.json({ requests: withMeta, total: Number(total), page: pageNum, limit: limitNum });
  } catch (err) {
    req.log.error({ err }, "Error listando solicitudes");
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// POST / — create request (technicianId optional — open request)
router.post("/", requireAuth, async (req, res) => {
  try {
    const userId = (req as any).userId;
    let { serviceId, technicianId, descripcion, direccion, fechaServicio, precioAcordado } = req.body;
    if (!serviceId && technicianId) {
      const tech = await db.query.techniciansTable.findFirst({ where: eq(techniciansTable.id, technicianId) });
      if (tech) serviceId = tech.serviceId;
    }
    if (!serviceId) {
      return res.status(400).json({ error: "serviceId es requerido para solicitudes sin técnico asignado" });
    }
    const [created] = await db.insert(serviceRequestsTable).values({
      userId,
      serviceId,
      technicianId: technicianId ?? null,
      descripcion,
      direccion,
      fechaServicio: new Date(fechaServicio),
      precioAcordado: precioAcordado ? String(precioAcordado) : null,
      status: "pendiente",
      trackingStatus: null,
    }).returning();
    res.status(201).json(await enrichRequest(created));
  } catch (err) {
    req.log.error({ err }, "Error creando solicitud");
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// GET /:id — single request
router.get("/:id", requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const request = await db.query.serviceRequestsTable.findFirst({ where: eq(serviceRequestsTable.id, id) });
    if (!request) return res.status(404).json({ error: "Solicitud no encontrada" });
    const enriched = await enrichRequest(request);
    // Attach offers
    const rawOffers = await db.select().from(offersTable)
      .where(eq(offersTable.requestId, id))
      .orderBy(desc(offersTable.createdAt));
    const offers = await Promise.all(rawOffers.map(enrichOffer));
    res.json({ ...enriched, offers });
  } catch (err) {
    req.log.error({ err }, "Error obteniendo solicitud");
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// GET /:id/offers — offers for a request
router.get("/:id/offers", requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const rawOffers = await db.select().from(offersTable)
      .where(eq(offersTable.requestId, id))
      .orderBy(desc(offersTable.createdAt));
    const offers = await Promise.all(rawOffers.map(enrichOffer));
    res.json(offers);
  } catch (err) {
    req.log.error({ err }, "Error obteniendo ofertas");
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// POST /:id/offer — technician submits offer
router.post("/:id/offer", requireAuth, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const requestId = parseInt(req.params.id);
    const { monto, comentario } = req.body;

    const tech = await db.query.techniciansTable.findFirst({ where: eq(techniciansTable.userId, userId) });
    if (!tech) return res.status(403).json({ error: "No eres técnico" });
    if (tech.status !== "aprobado") return res.status(403).json({ error: "Tu perfil aún no está aprobado" });

    const request = await db.query.serviceRequestsTable.findFirst({ where: eq(serviceRequestsTable.id, requestId) });
    if (!request) return res.status(404).json({ error: "Solicitud no encontrada" });
    if (request.status !== "pendiente") return res.status(400).json({ error: "La solicitud ya no está disponible" });

    // Upsert offer (one per technician per request)
    const existing = await db.query.offersTable.findFirst({
      where: and(eq(offersTable.requestId, requestId), eq(offersTable.technicianId, tech.id)),
    });

    let offer;
    if (existing) {
      const [updated] = await db.update(offersTable)
        .set({ monto: String(monto), comentario, status: "pendiente" })
        .where(eq(offersTable.id, existing.id))
        .returning();
      offer = updated;
    } else {
      const [created] = await db.insert(offersTable).values({
        requestId,
        technicianId: tech.id,
        monto: String(monto),
        comentario,
        status: "pendiente",
      }).returning();
      offer = created;
    }
    res.status(201).json(await enrichOffer(offer));
  } catch (err) {
    req.log.error({ err }, "Error enviando oferta");
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// POST /:id/accept-offer — client accepts a specific offer
router.post("/:id/accept-offer", requireAuth, async (req, res) => {
  try {
    const requestId = parseInt(req.params.id);
    const { offerId } = req.body;

    const offer = await db.query.offersTable.findFirst({ where: eq(offersTable.id, offerId) });
    if (!offer) return res.status(404).json({ error: "Oferta no encontrada" });

    // Accept this offer
    await db.update(offersTable).set({ status: "aceptada" }).where(eq(offersTable.id, offerId));
    // Reject all other offers for this request
    await db.update(offersTable)
      .set({ status: "rechazada" })
      .where(and(eq(offersTable.requestId, requestId), ne(offersTable.id, offerId)));

    // Update request: assign technician, set price — tracking starts only after payment
    const [updated] = await db.update(serviceRequestsTable)
      .set({
        technicianId: offer.technicianId,
        precioAcordado: offer.monto,
        status: "aceptada",
        trackingStatus: null,
        etaMinutos: null,
      })
      .where(eq(serviceRequestsTable.id, requestId))
      .returning();
    if (!updated) return res.status(404).json({ error: "Solicitud no encontrada" });
    res.json(await enrichRequest(updated));
  } catch (err) {
    req.log.error({ err }, "Error aceptando oferta");
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// PATCH /:id/tracking — technician updates tracking status
router.patch("/:id/tracking", requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { trackingStatus, etaMinutos } = req.body;
    const [updated] = await db.update(serviceRequestsTable)
      .set({
        ...(trackingStatus !== undefined && { trackingStatus }),
        ...(etaMinutos !== undefined && { etaMinutos }),
        ...(trackingStatus === "en_sitio" && { status: "en_progreso" }),
        ...(trackingStatus === "completado" && { status: "completada" }),
      })
      .where(eq(serviceRequestsTable.id, id))
      .returning();
    if (!updated) return res.status(404).json({ error: "Solicitud no encontrada" });
    res.json(await enrichRequest(updated));
  } catch (err) {
    req.log.error({ err }, "Error actualizando tracking");
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

async function updateRequestStatus(req: any, res: any, id: number, status: any, extra?: Record<string, any>) {
  const [updated] = await db.update(serviceRequestsTable)
    .set({ status, ...extra })
    .where(eq(serviceRequestsTable.id, id))
    .returning();
  if (!updated) return res.status(404).json({ error: "Solicitud no encontrada" });
  res.json(await enrichRequest(updated));
}

router.post("/:id/accept", requireAuth, async (req, res) => {
  try { await updateRequestStatus(req, res, parseInt(req.params.id), "aceptada"); }
  catch (err) { req.log.error({ err }, "Error aceptando solicitud"); res.status(500).json({ error: "Error interno del servidor" }); }
});

router.post("/:id/reject", requireAuth, async (req, res) => {
  try {
    const { motivo } = req.body;
    await updateRequestStatus(req, res, parseInt(req.params.id), "rechazada", { motivoCancelacion: motivo });
  } catch (err) { req.log.error({ err }, "Error rechazando solicitud"); res.status(500).json({ error: "Error interno del servidor" }); }
});

router.post("/:id/complete", requireAuth, async (req, res) => {
  try { await updateRequestStatus(req, res, parseInt(req.params.id), "completada"); }
  catch (err) { req.log.error({ err }, "Error completando solicitud"); res.status(500).json({ error: "Error interno del servidor" }); }
});

router.post("/:id/cancel", requireAuth, async (req, res) => {
  try { await updateRequestStatus(req, res, parseInt(req.params.id), "cancelada"); }
  catch (err) { req.log.error({ err }, "Error cancelando solicitud"); res.status(500).json({ error: "Error interno del servidor" }); }
});

export default router;
