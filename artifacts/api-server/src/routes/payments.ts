import { Router } from "express";
import { db } from "@workspace/db";
import {
  paymentsTable,
  serviceRequestsTable,
  techniciansTable,
  usersTable,
  servicesTable,
} from "@workspace/db";
import { eq, desc, and, inArray } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";
import { nanoid } from "nanoid";

const router = Router();

// ─── Technician earnings (must be before /:id) ─────────────────────────────
router.get("/my-earnings", requireAuth, async (req, res) => {
  try {
    const userId = (req as any).userId;

    // 1. Find technician profile
    const techRows = await db.select()
      .from(techniciansTable)
      .where(eq(techniciansTable.userId, userId));
    if (!techRows.length) {
      return res.status(404).json({ error: "No tienes perfil de técnico" });
    }
    const tech = techRows[0];

    // 2. Get all service requests assigned to this technician
    const requests = await db.select()
      .from(serviceRequestsTable)
      .where(eq(serviceRequestsTable.technicianId, tech.id))
      .orderBy(desc(serviceRequestsTable.fechaServicio));

    if (!requests.length) {
      return res.json({
        payments: [],
        monthly: [],
        summary: { totalHistorico: 0, estesMes: 0, totalTrabajos: 0, ticketPromedio: 0 },
      });
    }

    const requestIds = requests.map((r) => r.id);

    // 3. Get all payments for those requests
    const payments = await db.select()
      .from(paymentsTable)
      .where(inArray(paymentsTable.requestId, requestIds))
      .orderBy(desc(paymentsTable.createdAt));

    if (!payments.length) {
      return res.json({
        payments: [],
        monthly: [],
        summary: { totalHistorico: 0, estesMes: 0, totalTrabajos: 0, ticketPromedio: 0 },
      });
    }

    // 4. Collect unique client IDs and service IDs
    const clientIds = [...new Set(requests.map((r) => r.userId).filter((id): id is number => id != null))];
    const serviceIds = [...new Set(requests.map((r) => r.serviceId).filter((id): id is number => id != null))];

    const clients = clientIds.length
      ? await db.select({
          id: usersTable.id,
          nombre: usersTable.nombre,
          apellido: usersTable.apellido,
          avatarUrl: usersTable.avatarUrl,
        }).from(usersTable).where(inArray(usersTable.id, clientIds))
      : [];

    const svcs = serviceIds.length
      ? await db.select({
          id: servicesTable.id,
          nombre: servicesTable.nombre,
          icono: servicesTable.icono,
        }).from(servicesTable).where(inArray(servicesTable.id, serviceIds))
      : [];

    // 5. Build lookup maps
    const requestMap = new Map(requests.map((r) => [r.id, r]));
    const clientMap  = new Map(clients.map((c) => [c.id, c]));
    const serviceMap = new Map(svcs.map((s) => [s.id, s]));

    // 6. Enrich each payment
    const enriched = payments.map((p) => {
      const req    = requestMap.get(p.requestId);
      const client = req?.userId  != null ? clientMap.get(req.userId)   : null;
      const svc    = req?.serviceId != null ? serviceMap.get(req.serviceId) : null;
      return {
        id:           p.id,
        monto:        parseFloat(p.monto),
        metodoPago:   p.metodoPago,
        status:       p.status,
        referencia:   p.referencia,
        createdAt:    p.createdAt,
        requestId:    p.requestId,
        descripcion:  req?.descripcion   ?? "",
        direccion:    req?.direccion     ?? "",
        fechaServicio: req?.fechaServicio ?? null,
        cliente:      client ? `${client.nombre} ${client.apellido}` : "Cliente",
        clienteAvatar: client?.avatarUrl ?? null,
        servicio:     svc?.nombre ?? "Servicio",
        servicioIcono: svc?.icono ?? "wrench",
      };
    });

    // 7. Monthly breakdown (last 6 months)
    const byMonth: Record<string, number> = {};
    for (const p of enriched) {
      const key = new Date(p.createdAt).toLocaleDateString("es-PE", { month: "short", year: "numeric" });
      byMonth[key] = (byMonth[key] || 0) + p.monto;
    }
    const monthly = Object.entries(byMonth)
      .map(([mes, ingresos]) => ({ mes, ingresos }))
      .slice(-6);

    // 8. Summary stats
    const totalHistorico = enriched.reduce((s, p) => s + p.monto, 0);
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const estesMes = enriched
      .filter((p) => new Date(p.createdAt) >= firstDay)
      .reduce((s, p) => s + p.monto, 0);
    const ticketPromedio = enriched.length > 0 ? totalHistorico / enriched.length : 0;

    res.json({
      payments: enriched,
      monthly,
      summary: {
        totalHistorico,
        estesMes,
        totalTrabajos: enriched.length,
        ticketPromedio,
      },
    });
  } catch (err) {
    req.log.error({ err }, "Error obteniendo ingresos del técnico");
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// ─── Client payments list ───────────────────────────────────────────────────
router.get("/", requireAuth, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const { status, page = "1", limit = "20" } = req.query as Record<string, string>;
    const pageNum  = parseInt(page);
    const limitNum = parseInt(limit);
    const offset   = (pageNum - 1) * limitNum;

    const conditions = [eq(paymentsTable.userId, userId)];
    if (status) conditions.push(eq(paymentsTable.status, status as any));

    const query    = and(...conditions);
    const payments = await db.select().from(paymentsTable)
      .where(query)
      .orderBy(desc(paymentsTable.createdAt))
      .limit(limitNum).offset(offset);
    const total    = await db.$count(paymentsTable, query);

    // Enrich with service request info
    const requestIds = payments.map((p) => p.requestId).filter(Boolean);
    const requests = requestIds.length
      ? await db.select({
          id: serviceRequestsTable.id,
          serviceId: serviceRequestsTable.serviceId,
          descripcion: serviceRequestsTable.descripcion,
        }).from(serviceRequestsTable).where(inArray(serviceRequestsTable.id, requestIds))
      : [];

    const serviceIds = [...new Set(requests.map((r) => r.serviceId).filter((id): id is number => id != null))];
    const svcs = serviceIds.length
      ? await db.select({ id: servicesTable.id, nombre: servicesTable.nombre, icono: servicesTable.icono })
          .from(servicesTable).where(inArray(servicesTable.id, serviceIds))
      : [];

    const reqMap = new Map(requests.map((r) => [r.id, r]));
    const svcMap = new Map(svcs.map((s) => [s.id, s]));

    const enriched = payments.map((p) => {
      const req = reqMap.get(p.requestId);
      const svc = req?.serviceId != null ? svcMap.get(req.serviceId) : null;
      return {
        ...p,
        monto: parseFloat(p.monto),
        descripcion: req?.descripcion ?? "",
        servicio:    svc?.nombre     ?? "",
        servicioIcono: svc?.icono   ?? "wrench",
      };
    });

    res.json({ payments: enriched, total: Number(total), page: pageNum, limit: limitNum });
  } catch (err) {
    req.log.error({ err }, "Error listando pagos");
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// ─── Create payment ─────────────────────────────────────────────────────────
router.post("/", requireAuth, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const { requestId, monto, metodoPago } = req.body;
    const referencia = `FIXYA-${nanoid(10).toUpperCase()}`;
    const [created] = await db.insert(paymentsTable).values({
      requestId,
      userId,
      monto:      String(monto),
      metodoPago,
      status:     "completado",
      referencia,
    }).returning();

    const eta = Math.floor(Math.random() * 16) + 10;
    await db.update(serviceRequestsTable)
      .set({
        status:         "en_progreso",
        precioAcordado: String(monto),
        trackingStatus: "en_camino",
        etaMinutos:     eta,
      })
      .where(eq(serviceRequestsTable.id, requestId));

    res.status(201).json({ ...created, monto: parseFloat(created.monto) });
  } catch (err) {
    req.log.error({ err }, "Error creando pago");
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// ─── Get single payment ─────────────────────────────────────────────────────
router.get("/:id", requireAuth, async (req, res) => {
  try {
    const id      = parseInt(req.params.id);
    const payment = await db.query.paymentsTable.findFirst({ where: eq(paymentsTable.id, id) });
    if (!payment) return res.status(404).json({ error: "Pago no encontrado" });
    res.json({ ...payment, monto: parseFloat(payment.monto) });
  } catch (err) {
    req.log.error({ err }, "Error obteniendo pago");
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

export default router;
