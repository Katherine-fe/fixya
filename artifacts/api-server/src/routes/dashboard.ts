import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable, techniciansTable, serviceRequestsTable, paymentsTable, servicesTable } from "@workspace/db";
import { eq, desc, and } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";

const router = Router();

router.get("/summary", requireAuth, async (req, res) => {
  try {
    const totalUsuarios = await db.$count(usersTable);
    const totalTecnicos = await db.$count(techniciansTable, eq(techniciansTable.status, "aprobado"));
    const totalSolicitudes = await db.$count(serviceRequestsTable);
    const solicitudesPendientes = await db.$count(serviceRequestsTable, eq(serviceRequestsTable.status, "pendiente"));
    const tecnicosPendienteAprobacion = await db.$count(techniciansTable, eq(techniciansTable.status, "pendiente"));

    const allPayments = await db.select({ monto: paymentsTable.monto, createdAt: paymentsTable.createdAt })
      .from(paymentsTable).where(eq(paymentsTable.status, "completado"));
    const ingresosTotales = allPayments.reduce((s, p) => s + parseFloat(p.monto), 0);

    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const ingresosMes = allPayments
      .filter((p) => p.createdAt >= firstDayOfMonth)
      .reduce((s, p) => s + parseFloat(p.monto), 0);

    res.json({
      totalUsuarios: Number(totalUsuarios),
      totalTecnicos: Number(totalTecnicos),
      totalSolicitudes: Number(totalSolicitudes),
      solicitudesPendientes: Number(solicitudesPendientes),
      ingresosTotales,
      ingresosMes,
      tecnicosPendienteAprobacion: Number(tecnicosPendienteAprobacion),
    });
  } catch (err) {
    req.log.error({ err }, "Error en resumen del dashboard");
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

router.get("/user-summary", requireAuth, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const dbUser = await db.query.usersTable.findFirst({ where: eq(usersTable.id, userId) });
    if (!dbUser) return res.status(401).json({ error: "No autorizado" });

    const totalSolicitudes = await db.$count(serviceRequestsTable, eq(serviceRequestsTable.userId, dbUser.id));
    const solicitudesActivas = await db.$count(serviceRequestsTable, and(
      eq(serviceRequestsTable.userId, dbUser.id),
      eq(serviceRequestsTable.status, "aceptada"),
    ));
    const solicitudesCompletadas = await db.$count(serviceRequestsTable, and(
      eq(serviceRequestsTable.userId, dbUser.id),
      eq(serviceRequestsTable.status, "completada"),
    ));
    const payments = await db.select({ monto: paymentsTable.monto })
      .from(paymentsTable)
      .where(and(eq(paymentsTable.userId, dbUser.id), eq(paymentsTable.status, "completado")));
    const totalGastado = payments.reduce((s, p) => s + parseFloat(p.monto), 0);

    const recentRequestsRaw = await db.select().from(serviceRequestsTable)
      .where(eq(serviceRequestsTable.userId, dbUser.id))
      .orderBy(desc(serviceRequestsTable.createdAt))
      .limit(5);
    const recentRequests = await Promise.all(recentRequestsRaw.map(async (r) => ({
      ...r,
      precioAcordado: r.precioAcordado ? parseFloat(r.precioAcordado) : null,
      user: dbUser,
      technician: null,
      service: (await db.query.servicesTable.findFirst({ where: eq(servicesTable.id, r.serviceId) })) ?? null,
    })));

    res.json({
      totalSolicitudes: Number(totalSolicitudes),
      solicitudesActivas: Number(solicitudesActivas),
      solicitudesCompletadas: Number(solicitudesCompletadas),
      totalGastado,
      recentRequests,
    });
  } catch (err) {
    req.log.error({ err }, "Error en resumen del usuario");
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

router.get("/technician-summary", requireAuth, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const dbUser = await db.query.usersTable.findFirst({ where: eq(usersTable.id, userId) });
    if (!dbUser) return res.status(401).json({ error: "No autorizado" });
    const tech = await db.query.techniciansTable.findFirst({ where: eq(techniciansTable.userId, dbUser.id) });
    if (!tech) return res.status(404).json({ error: "Perfil de técnico no encontrado" });

    const solicitudesPendientes = await db.$count(serviceRequestsTable, and(
      eq(serviceRequestsTable.technicianId, tech.id), eq(serviceRequestsTable.status, "pendiente"),
    ));
    const solicitudesActivas = await db.$count(serviceRequestsTable, and(
      eq(serviceRequestsTable.technicianId, tech.id), eq(serviceRequestsTable.status, "aceptada"),
    ));
    const trabajosCompletados = await db.$count(serviceRequestsTable, and(
      eq(serviceRequestsTable.technicianId, tech.id), eq(serviceRequestsTable.status, "completada"),
    ));

    const allPayments = await db.select({ monto: paymentsTable.monto, createdAt: paymentsTable.createdAt })
      .from(paymentsTable)
      .innerJoin(serviceRequestsTable, eq(paymentsTable.requestId, serviceRequestsTable.id))
      .where(and(eq(serviceRequestsTable.technicianId, tech.id), eq(paymentsTable.status, "completado")));
    const ingresosTotales = allPayments.reduce((s, p) => s + parseFloat(p.monto), 0);
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const ingresosMes = allPayments
      .filter((p) => (p as any).createdAt >= firstDay)
      .reduce((s, p) => s + parseFloat(p.monto), 0);
    const promedioCalificacion = parseFloat(tech.promedioCalificacion ?? "0");

    const recentRequestsRaw = await db.select().from(serviceRequestsTable)
      .where(eq(serviceRequestsTable.technicianId, tech.id))
      .orderBy(desc(serviceRequestsTable.createdAt))
      .limit(5);
    const recentRequests = await Promise.all(recentRequestsRaw.map(async (r) => ({
      ...r,
      precioAcordado: r.precioAcordado ? parseFloat(r.precioAcordado) : null,
      user: (await db.query.usersTable.findFirst({ where: eq(usersTable.id, r.userId) })) ?? null,
      technician: null,
      service: (await db.query.servicesTable.findFirst({ where: eq(servicesTable.id, r.serviceId) })) ?? null,
    })));

    res.json({
      solicitudesPendientes: Number(solicitudesPendientes),
      solicitudesActivas: Number(solicitudesActivas),
      trabajosCompletados: Number(trabajosCompletados),
      ingresosTotales,
      ingresosMes,
      promedioCalificacion,
      recentRequests,
    });
  } catch (err) {
    req.log.error({ err }, "Error en resumen del técnico");
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

router.get("/requests-by-status", requireAuth, async (req, res) => {
  try {
    const statuses = ["pendiente", "aceptada", "en_progreso", "completada", "cancelada", "rechazada"];
    const result = await Promise.all(
      statuses.map(async (status) => ({
        status,
        count: Number(await db.$count(serviceRequestsTable, eq(serviceRequestsTable.status, status as any))),
      })),
    );
    res.json(result);
  } catch (err) {
    req.log.error({ err }, "Error obteniendo solicitudes por estado");
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

router.get("/revenue-by-month", requireAuth, async (req, res) => {
  try {
    const payments = await db.select().from(paymentsTable)
      .where(eq(paymentsTable.status, "completado"))
      .orderBy(paymentsTable.createdAt);

    const monthMap = new Map<string, { ingresos: number; solicitudes: number }>();
    const meses = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
    for (const p of payments) {
      const d = new Date(p.createdAt);
      const key = `${meses[d.getMonth()]} ${d.getFullYear()}`;
      const existing = monthMap.get(key) ?? { ingresos: 0, solicitudes: 0 };
      monthMap.set(key, { ingresos: existing.ingresos + parseFloat(p.monto), solicitudes: existing.solicitudes + 1 });
    }
    const result = Array.from(monthMap.entries()).map(([mes, data]) => ({ mes, ...data }));
    if (result.length === 0) {
      const now = new Date();
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        result.push({ mes: `${meses[d.getMonth()]} ${d.getFullYear()}`, ingresos: 0, solicitudes: 0 });
      }
    }
    res.json(result);
  } catch (err) {
    req.log.error({ err }, "Error obteniendo ingresos por mes");
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

router.get("/services-popularity", requireAuth, async (req, res) => {
  try {
    const services = await db.select().from(servicesTable);
    const total = await db.$count(serviceRequestsTable);
    const result = await Promise.all(
      services.map(async (s) => {
        const c = Number(await db.$count(serviceRequestsTable, eq(serviceRequestsTable.serviceId, s.id)));
        return {
          serviceName: s.nombre,
          count: c,
          porcentaje: total > 0 ? parseFloat(((c / Number(total)) * 100).toFixed(1)) : 0,
        };
      }),
    );
    res.json(result.sort((a, b) => b.count - a.count).filter((s) => s.count > 0));
  } catch (err) {
    req.log.error({ err }, "Error obteniendo popularidad de servicios");
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

router.get("/payment-methods", requireAuth, async (req, res) => {
  try {
    const payments = await db.select({ metodoPago: paymentsTable.metodoPago, monto: paymentsTable.monto })
      .from(paymentsTable).where(eq(paymentsTable.status, "completado"));
    const methodMap = new Map<string, { count: number; total: number }>();
    for (const p of payments) {
      const m = p.metodoPago;
      const existing = methodMap.get(m) ?? { count: 0, total: 0 };
      methodMap.set(m, { count: existing.count + 1, total: existing.total + parseFloat(p.monto) });
    }
    const labels: Record<string, string> = { yape: "Yape", plin: "Plin", tarjeta: "Tarjeta" };
    const result = Array.from(methodMap.entries()).map(([method, data]) => ({
      method,
      label: labels[method] ?? method,
      count: data.count,
      total: data.total,
    }));
    res.json(result.sort((a, b) => b.count - a.count));
  } catch (err) {
    req.log.error({ err }, "Error obteniendo métodos de pago");
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

router.get("/top-technicians", requireAuth, async (req, res) => {
  try {
    const technicians = await db.select().from(techniciansTable)
      .where(eq(techniciansTable.status, "aprobado"))
      .orderBy(desc(techniciansTable.promedioCalificacion));

    const result = await Promise.all(
      technicians.map(async (t) => {
        const techUser = await db.query.usersTable.findFirst({ where: eq(usersTable.id, t.userId) });
        const techService = await db.query.servicesTable.findFirst({ where: eq(servicesTable.id, t.serviceId) });
        const completed = Number(await db.$count(serviceRequestsTable, and(
          eq(serviceRequestsTable.technicianId, t.id),
          eq(serviceRequestsTable.status, "completada"),
        )));
        const pending = Number(await db.$count(serviceRequestsTable, and(
          eq(serviceRequestsTable.technicianId, t.id),
          eq(serviceRequestsTable.status, "pendiente"),
        )));
        const allPay = await db.select({ monto: paymentsTable.monto })
          .from(paymentsTable)
          .innerJoin(serviceRequestsTable, eq(paymentsTable.requestId, serviceRequestsTable.id))
          .where(and(eq(serviceRequestsTable.technicianId, t.id), eq(paymentsTable.status, "completado")));
        const ingresos = allPay.reduce((s, p) => s + parseFloat(p.monto), 0);
        return {
          id: t.id,
          nombre: techUser ? `${techUser.nombre} ${techUser.apellido}` : "N/A",
          servicio: techService?.nombre ?? "N/A",
          especialidad: t.especialidad,
          rating: parseFloat(t.promedioCalificacion ?? "0"),
          trabajosCompletados: completed,
          trabajosPendientes: pending,
          totalTrabajos: t.totalTrabajos,
          ingresos,
          disponible: t.disponible,
        };
      }),
    );
    res.json(result.sort((a, b) => b.rating - a.rating));
  } catch (err) {
    req.log.error({ err }, "Error obteniendo top técnicos");
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

router.get("/recent-activity", requireAuth, async (req, res) => {
  try {
    const recentReqs = await db.select().from(serviceRequestsTable)
      .orderBy(desc(serviceRequestsTable.createdAt))
      .limit(10);
    const activity = await Promise.all(
      recentReqs.map(async (r) => {
        const user = await db.query.usersTable.findFirst({ where: eq(usersTable.id, r.userId) });
        const service = await db.query.servicesTable.findFirst({ where: eq(servicesTable.id, r.serviceId) });
        return {
          id: r.id,
          status: r.status,
          fechaServicio: r.fechaServicio,
          createdAt: r.createdAt,
          precioAcordado: r.precioAcordado ? parseFloat(r.precioAcordado) : null,
          usuario: user ? `${user.nombre} ${user.apellido}` : "Desconocido",
          servicio: service?.nombre ?? "N/A",
        };
      }),
    );
    res.json(activity);
  } catch (err) {
    req.log.error({ err }, "Error obteniendo actividad reciente");
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

export default router;
