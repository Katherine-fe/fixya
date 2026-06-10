import { Router } from "express";
import bcrypt from "bcryptjs";
import { db } from "@workspace/db";
import {
  usersTable,
  techniciansTable,
  serviceRequestsTable,
  paymentsTable,
  reviewsTable,
  servicesTable,
  offersTable,
} from "@workspace/db";
import { eq, inArray, or } from "drizzle-orm";

const router = Router();

const DEMO_EMAILS = [
  "admin@fixya.com",
  "cliente@fixya.com",
  "tecnico@fixya.com",
  "pedro.ramirez@fixya.com",
  "lucia.torres@fixya.com",
  "jose.mendoza@fixya.com",
  "luis.rojas@fixya.com",
  "ana.flores@fixya.com",
  "roberto.silva@fixya.com",
  "carmen.vargas@fixya.com",
  "martin.castillo@fixya.com",
  "sofia.herrera@fixya.com",
  "diego.morales@fixya.com",
  "valeria.gutierrez@fixya.com",
  "andres.paredes@fixya.com",
  "hugo.quispe@fixya.com",
  "rosa.mamani@fixya.com",
  "edgar.ccoa@fixya.com",
  "patricia.leon@fixya.com",
  "frank.nina@fixya.com",
];

router.get("/status", async (_req, res) => {
  const usuarios    = Number(await db.$count(usersTable));
  const tecnicos    = Number(await db.$count(techniciansTable));
  const solicitudes = Number(await db.$count(serviceRequestsTable));
  const pagos       = Number(await db.$count(paymentsTable));
  res.json({ usuarios, tecnicos, solicitudes, pagos });
});

router.post("/", async (req, res) => {
  try {
    const ROUNDS = 10;
    const [adminHash, clienteHash, tecnicoHash, demoHash] = await Promise.all([
      bcrypt.hash("admin123",   ROUNDS),
      bcrypt.hash("cliente123", ROUNDS),
      bcrypt.hash("tecnico123", ROUNDS),
      bcrypt.hash("demo123",    ROUNDS),
    ]);

    const services = await db.select().from(servicesTable);
    const svc = (keyword: string) =>
      services.find((s) => s.nombre.toLowerCase().includes(keyword.toLowerCase())) ?? services[0];

    const elecSvc  = svc("electr");
    const gasfiSvc = svc("gasfit") ?? svc("plom") ?? services[0];
    const carpSvc  = svc("carp");
    const pintSvc  = svc("pint");
    const acSvc    = svc("aire") ?? svc("acond") ?? services[0];
    const limpSvc  = svc("limp");
    const cerrSvc  = svc("cerr")   ?? svc("cerraj") ?? services[0];
    const jarSvc   = svc("jard")   ?? services[0];
    const albanSvc = svc("alba")   ?? services[0];

    // Clean up existing demo data
    const existingUsers = await db.select({ id: usersTable.id })
      .from(usersTable)
      .where(inArray(usersTable.email, DEMO_EMAILS));
    const userIds = existingUsers.map((u) => u.id);

    if (userIds.length > 0) {
      const existingTechs = await db.select({ id: techniciansTable.id })
        .from(techniciansTable)
        .where(inArray(techniciansTable.userId, userIds));
      const techIds = existingTechs.map((t) => t.id);

      const existingRequests = await db.select({ id: serviceRequestsTable.id })
        .from(serviceRequestsTable)
        .where(
          techIds.length > 0
            ? or(
                inArray(serviceRequestsTable.userId, userIds),
                inArray(serviceRequestsTable.technicianId, techIds),
              )
            : inArray(serviceRequestsTable.userId, userIds),
        );
      const requestIds = existingRequests.map((r) => r.id);

      if (requestIds.length > 0) {
        await db.delete(offersTable).where(inArray(offersTable.requestId, requestIds));
        await db.delete(reviewsTable).where(inArray(reviewsTable.requestId, requestIds));
        await db.delete(paymentsTable).where(inArray(paymentsTable.requestId, requestIds));
        await db.delete(serviceRequestsTable).where(inArray(serviceRequestsTable.id, requestIds));
      }
      if (techIds.length > 0) {
        await db.delete(techniciansTable).where(inArray(techniciansTable.id, techIds));
      }
      await db.delete(usersTable).where(inArray(usersTable.id, userIds));
    }

    const daysAgo = (n: number) => {
      const d = new Date();
      d.setDate(d.getDate() - n);
      return d;
    };

    const ref = () => `FIXYA-${Math.random().toString(36).slice(2, 12).toUpperCase()}`;

    // ─── USERS ─────────────────────────────────────────────────────────────────
    const [admin] = await db.insert(usersTable).values({
      nombre: "Admin", apellido: "FixYa", email: "admin@fixya.com",
      passwordHash: adminHash, role: "administrador",
      telefono: "999-000-001", activo: true,
      avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=AdminFixYa`,
    }).returning();

    const [cliente1] = await db.insert(usersTable).values({
      nombre: "María", apellido: "García", email: "cliente@fixya.com",
      passwordHash: clienteHash, role: "usuario",
      telefono: "987-654-321", direccion: "Av. Larco 456, Miraflores, Lima",
      activo: true, avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=MariaGarcia`,
    }).returning();

    const [tecUser1] = await db.insert(usersTable).values({
      nombre: "Carlos", apellido: "Quispe", email: "tecnico@fixya.com",
      passwordHash: tecnicoHash, role: "tecnico",
      telefono: "976-543-210", direccion: "Calle Los Pinos 123, San Borja, Lima",
      activo: true, avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=CarlosQuispe`,
    }).returning();

    const [cliente2] = await db.insert(usersTable).values({
      nombre: "Pedro", apellido: "Ramírez", email: "pedro.ramirez@fixya.com",
      passwordHash: demoHash, role: "usuario",
      telefono: "944-321-098", direccion: "Calle Los Robles 789, La Molina, Lima",
      activo: true, avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=PedroRamirez`,
    }).returning();

    const [cliente3] = await db.insert(usersTable).values({
      nombre: "Lucía", apellido: "Torres", email: "lucia.torres@fixya.com",
      passwordHash: demoHash, role: "usuario",
      telefono: "955-432-109", direccion: "Jr. Huallaga 321, Cercado, Lima",
      activo: true, avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=LuciaTorres`,
    }).returning();

    const [tecUser2] = await db.insert(usersTable).values({
      nombre: "José", apellido: "Mendoza", email: "jose.mendoza@fixya.com",
      passwordHash: demoHash, role: "tecnico",
      telefono: "987-123-456", direccion: "Av. Brasil 555, Breña, Lima",
      activo: true, avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=JoseMendoza`,
    }).returning();

    const [tecUser3] = await db.insert(usersTable).values({
      nombre: "Luis", apellido: "Rojas", email: "luis.rojas@fixya.com",
      passwordHash: demoHash, role: "tecnico",
      telefono: "976-234-567", direccion: "Calle Los Álamos 12, La Molina, Lima",
      activo: true, avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=LuisRojas`,
    }).returning();

    const [tecUser4] = await db.insert(usersTable).values({
      nombre: "Ana", apellido: "Flores", email: "ana.flores@fixya.com",
      passwordHash: demoHash, role: "tecnico",
      telefono: "965-345-678", direccion: "Av. Universitaria 890, San Miguel, Lima",
      activo: true, avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=AnaFlores`,
    }).returning();

    const [tecUser5] = await db.insert(usersTable).values({
      nombre: "Roberto", apellido: "Silva", email: "roberto.silva@fixya.com",
      passwordHash: demoHash, role: "tecnico",
      telefono: "954-456-789", direccion: "Jr. Camaná 100, Cercado, Lima",
      activo: true, avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=RobertoSilva`,
    }).returning();

    const [tecUser6] = await db.insert(usersTable).values({
      nombre: "Carmen", apellido: "Vargas", email: "carmen.vargas@fixya.com",
      passwordHash: demoHash, role: "tecnico",
      telefono: "943-567-890", direccion: "Av. Arequipa 2345, Lince, Lima",
      activo: true, avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=CarmenVargas`,
    }).returning();

    // New clients
    const [cliente4] = await db.insert(usersTable).values({
      nombre: "Martín", apellido: "Castillo", email: "martin.castillo@fixya.com",
      passwordHash: demoHash, role: "usuario",
      telefono: "988-111-222", direccion: "Av. Salaverry 1234, Jesús María, Lima",
      activo: true, avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=MartinCastillo`,
    }).returning();

    const [cliente5] = await db.insert(usersTable).values({
      nombre: "Sofía", apellido: "Herrera", email: "sofia.herrera@fixya.com",
      passwordHash: demoHash, role: "usuario",
      telefono: "977-222-333", direccion: "Jr. Washington 567, Pueblo Libre, Lima",
      activo: true, avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=SofiaHerrera`,
    }).returning();

    const [cliente6] = await db.insert(usersTable).values({
      nombre: "Diego", apellido: "Morales", email: "diego.morales@fixya.com",
      passwordHash: demoHash, role: "usuario",
      telefono: "966-333-444", direccion: "Calle Tarapacá 890, Barranco, Lima",
      activo: true, avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=DiegoMorales`,
    }).returning();

    const [cliente7] = await db.insert(usersTable).values({
      nombre: "Valeria", apellido: "Gutiérrez", email: "valeria.gutierrez@fixya.com",
      passwordHash: demoHash, role: "usuario",
      telefono: "955-444-555", direccion: "Av. El Sol 321, San Isidro, Lima",
      activo: true, avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=ValeriaGutierrez`,
    }).returning();

    const [cliente8] = await db.insert(usersTable).values({
      nombre: "Andrés", apellido: "Paredes", email: "andres.paredes@fixya.com",
      passwordHash: demoHash, role: "usuario",
      telefono: "944-555-666", direccion: "Jr. Colmena 654, Cercado, Lima",
      activo: true, avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=AndresParedes`,
    }).returning();

    // New technicians
    const [tecUser7] = await db.insert(usersTable).values({
      nombre: "Hugo", apellido: "Quispe", email: "hugo.quispe@fixya.com",
      passwordHash: demoHash, role: "tecnico",
      telefono: "932-666-777", direccion: "Av. Los Héroes 456, SJM, Lima",
      activo: true, avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=HugoQuispe`,
    }).returning();

    const [tecUser8] = await db.insert(usersTable).values({
      nombre: "Rosa", apellido: "Mamani", email: "rosa.mamani@fixya.com",
      passwordHash: demoHash, role: "tecnico",
      telefono: "921-777-888", direccion: "Jr. Caylloma 123, Surco, Lima",
      activo: true, avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=RosaMamani`,
    }).returning();

    const [tecUser9] = await db.insert(usersTable).values({
      nombre: "Edgar", apellido: "Ccoa", email: "edgar.ccoa@fixya.com",
      passwordHash: demoHash, role: "tecnico",
      telefono: "910-888-999", direccion: "Av. Benavides 789, Miraflores, Lima",
      activo: true, avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=EdgarCcoa`,
    }).returning();

    const [tecUser10] = await db.insert(usersTable).values({
      nombre: "Patricia", apellido: "León", email: "patricia.leon@fixya.com",
      passwordHash: demoHash, role: "tecnico",
      telefono: "999-123-000", direccion: "Av. Javier Prado 1234, San Borja, Lima",
      activo: true, avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=PatriciaLeon`,
    }).returning();

    const [tecUser11] = await db.insert(usersTable).values({
      nombre: "Frank", apellido: "Nina", email: "frank.nina@fixya.com",
      passwordHash: demoHash, role: "tecnico",
      telefono: "988-000-111", direccion: "Jr. Quilca 200, Cercado, Lima",
      activo: true, avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=FrankNina`,
    }).returning();

    // ─── TECHNICIANS ──────────────────────────────────────────────────────────
    const [tech1] = await db.insert(techniciansTable).values({
      userId: tecUser1.id, serviceId: elecSvc.id,
      especialidad: "Instalaciones eléctricas residenciales y tableros",
      descripcion: "Técnico electricista certificado con 5 años de experiencia en instalaciones residenciales y comerciales.",
      experienciaAnios: 5, precioHora: "60.00", disponible: true,
      status: "aprobado", promedioCalificacion: "4.80", totalTrabajos: 47,
    }).returning();

    const [tech2] = await db.insert(techniciansTable).values({
      userId: tecUser2.id, serviceId: gasfiSvc.id,
      especialidad: "Gasfitería, tuberías, termas y sistemas de agua caliente",
      descripcion: "Gasfitero profesional con más de 8 años de experiencia. Reparación de tuberías, instalación de termas.",
      experienciaAnios: 8, precioHora: "55.00", disponible: true,
      status: "aprobado", promedioCalificacion: "4.90", totalTrabajos: 89,
    }).returning();

    const [tech3] = await db.insert(techniciansTable).values({
      userId: tecUser3.id, serviceId: carpSvc.id,
      especialidad: "Carpintería fina y fabricación de muebles a medida",
      descripcion: "Carpintero con 6 años de experiencia en fabricación de muebles, puertas y acabados finos.",
      experienciaAnios: 6, precioHora: "50.00", disponible: true,
      status: "aprobado", promedioCalificacion: "4.70", totalTrabajos: 62,
    }).returning();

    const [tech4] = await db.insert(techniciansTable).values({
      userId: tecUser4.id, serviceId: pintSvc.id,
      especialidad: "Pintura interior y exterior, técnicas decorativas",
      descripcion: "Pintora profesional con 4 años de experiencia. Especializada en técnicas modernas y acabados decorativos.",
      experienciaAnios: 4, precioHora: "45.00", disponible: true,
      status: "aprobado", promedioCalificacion: "4.60", totalTrabajos: 38,
    }).returning();

    const [tech5] = await db.insert(techniciansTable).values({
      userId: tecUser5.id, serviceId: acSvc.id,
      especialidad: "Instalación y mantenimiento de aire acondicionado",
      descripcion: "Técnico certificado en sistemas de A/C y refrigeración. 7 años de experiencia.",
      experienciaAnios: 7, precioHora: "70.00", disponible: true,
      status: "aprobado", promedioCalificacion: "4.80", totalTrabajos: 55,
    }).returning();

    const [tech6] = await db.insert(techniciansTable).values({
      userId: tecUser6.id, serviceId: limpSvc.id,
      especialidad: "Limpieza profunda y desinfección de hogares y oficinas",
      descripcion: "Especialista en limpieza profunda con 3 años de experiencia.",
      experienciaAnios: 3, precioHora: "35.00", disponible: false,
      status: "aprobado", promedioCalificacion: "4.50", totalTrabajos: 29,
    }).returning();

    const [tech7] = await db.insert(techniciansTable).values({
      userId: tecUser7.id, serviceId: cerrSvc.id,
      especialidad: "Cerrajería residencial, comercial y aperturas de emergencia",
      descripcion: "Cerrajero profesional con 9 años de experiencia. Apertura de puertas, cambio de cerraduras y sistemas de seguridad.",
      experienciaAnios: 9, precioHora: "65.00", disponible: true,
      status: "aprobado", promedioCalificacion: "4.85", totalTrabajos: 112,
    }).returning();

    const [tech8] = await db.insert(techniciansTable).values({
      userId: tecUser8.id, serviceId: jarSvc.id,
      especialidad: "Jardinería, poda y diseño de jardines",
      descripcion: "Paisajista y jardinera con 5 años de experiencia. Diseño, instalación y mantenimiento de áreas verdes.",
      experienciaAnios: 5, precioHora: "40.00", disponible: true,
      status: "aprobado", promedioCalificacion: "4.65", totalTrabajos: 43,
    }).returning();

    const [tech9] = await db.insert(techniciansTable).values({
      userId: tecUser9.id, serviceId: albanSvc.id,
      especialidad: "Albañilería, acabados y remodelaciones",
      descripcion: "Maestro albañil con 12 años de experiencia en remodelaciones, enchapes y trabajos de concreto.",
      experienciaAnios: 12, precioHora: "58.00", disponible: true,
      status: "aprobado", promedioCalificacion: "4.75", totalTrabajos: 78,
    }).returning();

    // Pending technicians for admin approval
    const [tech10] = await db.insert(techniciansTable).values({
      userId: tecUser10.id, serviceId: elecSvc.id,
      especialidad: "Instalaciones eléctricas industriales y domésticas",
      descripcion: "Ingeniera eléctrica con certificación INDECI. 6 años de experiencia en proyectos residenciales y de oficinas.",
      experienciaAnios: 6, precioHora: "75.00", disponible: true,
      status: "pendiente", promedioCalificacion: "0.00", totalTrabajos: 0,
    }).returning();

    const [tech11] = await db.insert(techniciansTable).values({
      userId: tecUser11.id, serviceId: gasfiSvc.id,
      especialidad: "Sistemas hidráulicos y gasfitería industrial",
      descripcion: "Técnico gasfitero con especialización en sistemas de agua caliente centralizada y tuberías de gas.",
      experienciaAnios: 4, precioHora: "50.00", disponible: true,
      status: "pendiente", promedioCalificacion: "0.00", totalTrabajos: 0,
    }).returning();

    // ─── SERVICE REQUESTS (spread over 6 months) ──────────────────────────────
    const allClients = [cliente1, cliente2, cliente3, cliente4, cliente5, cliente6, cliente7, cliente8];

    // November (5 months ago)
    const [r1] = await db.insert(serviceRequestsTable).values({
      userId: cliente1.id, technicianId: tech1.id, serviceId: elecSvc.id,
      descripcion: "El tablero eléctrico dispara el diferencial constantemente. Necesito revisión urgente y reparación.",
      direccion: "Av. Larco 456 Dpto 302, Miraflores, Lima",
      fechaServicio: daysAgo(155), status: "completada", precioAcordado: "120.00",
    }).returning();

    const [r2] = await db.insert(serviceRequestsTable).values({
      userId: cliente2.id, technicianId: tech2.id, serviceId: gasfiSvc.id,
      descripcion: "Fuga de agua en tubería del baño principal. Sale agua por debajo del inodoro.",
      direccion: "Calle Los Robles 789, La Molina, Lima",
      fechaServicio: daysAgo(150), status: "completada", precioAcordado: "95.00",
    }).returning();

    const [r3] = await db.insert(serviceRequestsTable).values({
      userId: cliente4.id, technicianId: tech7.id, serviceId: cerrSvc.id,
      descripcion: "Se rompió la cerradura de la puerta principal. Necesito cambio urgente.",
      direccion: "Av. Salaverry 1234, Jesús María, Lima",
      fechaServicio: daysAgo(148), status: "completada", precioAcordado: "80.00",
    }).returning();

    // December
    const [r4] = await db.insert(serviceRequestsTable).values({
      userId: cliente3.id, technicianId: tech3.id, serviceId: carpSvc.id,
      descripcion: "Instalar 2 closets empotrados en habitaciones y reparar puerta principal.",
      direccion: "Jr. Huallaga 321, Cercado, Lima",
      fechaServicio: daysAgo(120), status: "completada", precioAcordado: "380.00",
    }).returning();

    const [r5] = await db.insert(serviceRequestsTable).values({
      userId: cliente5.id, technicianId: tech4.id, serviceId: pintSvc.id,
      descripcion: "Pintura de sala, comedor y corredor. Paredes en mal estado necesitan preparación previa.",
      direccion: "Jr. Washington 567, Pueblo Libre, Lima",
      fechaServicio: daysAgo(115), status: "completada", precioAcordado: "320.00",
    }).returning();

    const [r6] = await db.insert(serviceRequestsTable).values({
      userId: cliente6.id, technicianId: tech9.id, serviceId: albanSvc.id,
      descripcion: "Enchapar baño completo con mayólicas nuevas. Incluye piso y paredes.",
      direccion: "Calle Tarapacá 890, Barranco, Lima",
      fechaServicio: daysAgo(112), status: "completada", precioAcordado: "550.00",
    }).returning();

    const [r7] = await db.insert(serviceRequestsTable).values({
      userId: cliente1.id, technicianId: tech5.id, serviceId: acSvc.id,
      descripcion: "Instalación de aire acondicionado 12000 BTU en sala-comedor.",
      direccion: "Av. Larco 456 Dpto 302, Miraflores, Lima",
      fechaServicio: daysAgo(108), status: "completada", precioAcordado: "250.00",
    }).returning();

    // January
    const [r8] = await db.insert(serviceRequestsTable).values({
      userId: cliente2.id, technicianId: tech1.id, serviceId: elecSvc.id,
      descripcion: "Cortocircuito en la cocina. Los focos parpadean y hay olor a quemado.",
      direccion: "Calle Los Robles 789, La Molina, Lima",
      fechaServicio: daysAgo(90), status: "completada", precioAcordado: "85.00",
    }).returning();

    const [r9] = await db.insert(serviceRequestsTable).values({
      userId: cliente7.id, technicianId: tech8.id, serviceId: jarSvc.id,
      descripcion: "Poda de jardín de 80m2, retiro de maleza y fertilización de plantas.",
      direccion: "Av. El Sol 321, San Isidro, Lima",
      fechaServicio: daysAgo(88), status: "completada", precioAcordado: "140.00",
    }).returning();

    const [r10] = await db.insert(serviceRequestsTable).values({
      userId: cliente3.id, technicianId: tech2.id, serviceId: gasfiSvc.id,
      descripcion: "Cambio de grifo de cocina y reparación del sifón bajo el lavadero.",
      direccion: "Jr. Huallaga 321, Cercado, Lima",
      fechaServicio: daysAgo(85), status: "completada", precioAcordado: "75.00",
    }).returning();

    const [r11] = await db.insert(serviceRequestsTable).values({
      userId: cliente4.id, technicianId: tech6.id, serviceId: limpSvc.id,
      descripcion: "Limpieza profunda post-mudanza en apartamento de 3 habitaciones.",
      direccion: "Av. Salaverry 1234, Jesús María, Lima",
      fechaServicio: daysAgo(82), status: "completada", precioAcordado: "180.00",
    }).returning();

    const [r12] = await db.insert(serviceRequestsTable).values({
      userId: cliente8.id, technicianId: tech9.id, serviceId: albanSvc.id,
      descripcion: "Reparación de rajaduras en paredes exteriores e impermeabilización.",
      direccion: "Jr. Colmena 654, Cercado, Lima",
      fechaServicio: daysAgo(78), status: "completada", precioAcordado: "420.00",
    }).returning();

    // February
    const [r13] = await db.insert(serviceRequestsTable).values({
      userId: cliente5.id, technicianId: tech1.id, serviceId: elecSvc.id,
      descripcion: "Instalar 8 puntos de luz en cocina y cambiar tomacorrientes de sala.",
      direccion: "Jr. Washington 567, Pueblo Libre, Lima",
      fechaServicio: daysAgo(65), status: "completada", precioAcordado: "190.00",
    }).returning();

    const [r14] = await db.insert(serviceRequestsTable).values({
      userId: cliente6.id, technicianId: tech7.id, serviceId: cerrSvc.id,
      descripcion: "Cambio de cerradura de alta seguridad en puerta blindada.",
      direccion: "Calle Tarapacá 890, Barranco, Lima",
      fechaServicio: daysAgo(62), status: "completada", precioAcordado: "150.00",
    }).returning();

    const [r15] = await db.insert(serviceRequestsTable).values({
      userId: cliente1.id, technicianId: tech3.id, serviceId: carpSvc.id,
      descripcion: "Fabricación de librero empotrado a medida para estudio.",
      direccion: "Av. Larco 456 Dpto 302, Miraflores, Lima",
      fechaServicio: daysAgo(60), status: "completada", precioAcordado: "480.00",
    }).returning();

    const [r16] = await db.insert(serviceRequestsTable).values({
      userId: cliente7.id, technicianId: tech5.id, serviceId: acSvc.id,
      descripcion: "Mantenimiento preventivo de 2 equipos de A/C. Limpieza de filtros y gas.",
      direccion: "Av. El Sol 321, San Isidro, Lima",
      fechaServicio: daysAgo(58), status: "completada", precioAcordado: "160.00",
    }).returning();

    const [r17] = await db.insert(serviceRequestsTable).values({
      userId: cliente2.id, technicianId: tech4.id, serviceId: pintSvc.id,
      descripcion: "Pintura de sala y comedor (35m2) con tratamiento de humedad.",
      direccion: "Calle Los Robles 789, La Molina, Lima",
      fechaServicio: daysAgo(55), status: "completada", precioAcordado: "480.00",
    }).returning();

    const [r18] = await db.insert(serviceRequestsTable).values({
      userId: cliente8.id, technicianId: tech2.id, serviceId: gasfiSvc.id,
      descripcion: "Instalación de terma eléctrica en baño principal.",
      direccion: "Jr. Colmena 654, Cercado, Lima",
      fechaServicio: daysAgo(50), status: "completada", precioAcordado: "220.00",
    }).returning();

    // March
    const [r19] = await db.insert(serviceRequestsTable).values({
      userId: cliente3.id, technicianId: tech9.id, serviceId: albanSvc.id,
      descripcion: "Construcción de cuarto adicional en azotea, 12m2.",
      direccion: "Jr. Huallaga 321, Cercado, Lima",
      fechaServicio: daysAgo(42), status: "completada", precioAcordado: "1800.00",
    }).returning();

    const [r20] = await db.insert(serviceRequestsTable).values({
      userId: cliente4.id, technicianId: tech1.id, serviceId: elecSvc.id,
      descripcion: "Instalación de sistema de seguridad con cámaras y alarma.",
      direccion: "Av. Salaverry 1234, Jesús María, Lima",
      fechaServicio: daysAgo(40), status: "completada", precioAcordado: "650.00",
    }).returning();

    const [r21] = await db.insert(serviceRequestsTable).values({
      userId: cliente5.id, technicianId: tech8.id, serviceId: jarSvc.id,
      descripcion: "Diseño y siembra de jardín en terraza de 40m2.",
      direccion: "Jr. Washington 567, Pueblo Libre, Lima",
      fechaServicio: daysAgo(38), status: "completada", precioAcordado: "350.00",
    }).returning();

    const [r22] = await db.insert(serviceRequestsTable).values({
      userId: cliente6.id, technicianId: tech6.id, serviceId: limpSvc.id,
      descripcion: "Desinfección y limpieza profunda de oficina de 120m2.",
      direccion: "Calle Tarapacá 890, Barranco, Lima",
      fechaServicio: daysAgo(35), status: "completada", precioAcordado: "280.00",
    }).returning();

    const [r23] = await db.insert(serviceRequestsTable).values({
      userId: cliente7.id, technicianId: tech7.id, serviceId: cerrSvc.id,
      descripcion: "Instalación de chapa eléctrica y sistema de control de acceso.",
      direccion: "Av. El Sol 321, San Isidro, Lima",
      fechaServicio: daysAgo(32), status: "completada", precioAcordado: "390.00",
    }).returning();

    // April / May (recent)
    const [r24] = await db.insert(serviceRequestsTable).values({
      userId: cliente1.id, technicianId: tech2.id, serviceId: gasfiSvc.id,
      descripcion: "Instalación de terma solar en techo de 3 pisos. Mano de obra completa.",
      direccion: "Av. Larco 456 Dpto 302, Miraflores, Lima",
      fechaServicio: daysAgo(20), status: "completada", precioAcordado: "680.00",
    }).returning();

    const [r25] = await db.insert(serviceRequestsTable).values({
      userId: cliente8.id, technicianId: tech4.id, serviceId: pintSvc.id,
      descripcion: "Pintura exterior de casa de 2 pisos, preparación y 2 manos.",
      direccion: "Jr. Colmena 654, Cercado, Lima",
      fechaServicio: daysAgo(18), status: "completada", precioAcordado: "750.00",
    }).returning();

    const [r26] = await db.insert(serviceRequestsTable).values({
      userId: cliente2.id, technicianId: tech5.id, serviceId: acSvc.id,
      descripcion: "Instalación de minisplit inverter 18000 BTU en dormitorio principal.",
      direccion: "Calle Los Robles 789, La Molina, Lima",
      fechaServicio: daysAgo(12), status: "completada", precioAcordado: "320.00",
    }).returning();

    const [r27] = await db.insert(serviceRequestsTable).values({
      userId: cliente3.id, technicianId: tech3.id, serviceId: carpSvc.id,
      descripcion: "Reparación de muebles de cocina y tapizado de 6 sillas del comedor.",
      direccion: "Jr. Huallaga 321, Cercado, Lima",
      fechaServicio: daysAgo(10), status: "completada", precioAcordado: "260.00",
    }).returning();

    // Active requests
    const [r28] = await db.insert(serviceRequestsTable).values({
      userId: cliente2.id, technicianId: tech4.id, serviceId: pintSvc.id,
      descripcion: "Pintura de sala y comedor (aprox 35m2). Hay una pared con humedad.",
      direccion: "Calle Los Robles 789, La Molina, Lima",
      fechaServicio: daysAgo(5), status: "en_progreso", precioAcordado: "480.00",
      trackingStatus: "en_sitio", etaMinutos: 0,
    }).returning();

    const [r29] = await db.insert(serviceRequestsTable).values({
      userId: cliente4.id, technicianId: tech9.id, serviceId: albanSvc.id,
      descripcion: "Reparación de fisuras en fachada e impermeabilización.",
      direccion: "Av. Salaverry 1234, Jesús María, Lima",
      fechaServicio: daysAgo(2), status: "en_progreso", precioAcordado: "380.00",
      trackingStatus: "en_camino", etaMinutos: 15,
    }).returning();

    const [r30] = await db.insert(serviceRequestsTable).values({
      userId: cliente5.id, technicianId: tech1.id, serviceId: elecSvc.id,
      descripcion: "Instalar 5 puntos de luz en cocina y cambiar tomacorrientes.",
      direccion: "Jr. Washington 567, Pueblo Libre, Lima",
      fechaServicio: daysAgo(3), status: "aceptada", precioAcordado: "180.00",
    }).returning();

    // Pending requests (open for bidding)
    const [r31] = await db.insert(serviceRequestsTable).values({
      userId: cliente6.id, serviceId: gasfiSvc.id,
      descripcion: "Presión de agua muy baja en todo el departamento. Revisar tuberías.",
      direccion: "Calle Tarapacá 890, Barranco, Lima",
      fechaServicio: daysAgo(1), status: "pendiente",
    }).returning();

    const [r32] = await db.insert(serviceRequestsTable).values({
      userId: cliente7.id, serviceId: limpSvc.id,
      descripcion: "Limpieza profunda de departamento de 2 habitaciones antes de mudanza.",
      direccion: "Av. El Sol 321, San Isidro, Lima",
      fechaServicio: daysAgo(0), status: "pendiente",
    }).returning();

    const [r33] = await db.insert(serviceRequestsTable).values({
      userId: cliente8.id, serviceId: cerrSvc.id,
      descripcion: "Puerta principal no cierra bien, la cerradura está dañada. Emergencia.",
      direccion: "Jr. Colmena 654, Cercado, Lima",
      fechaServicio: daysAgo(0), status: "pendiente",
    }).returning();

    const [r34] = await db.insert(serviceRequestsTable).values({
      userId: cliente1.id, serviceId: carpSvc.id,
      descripcion: "Fabricar mesa de trabajo de madera maciza para estudio en casa.",
      direccion: "Av. Larco 456 Dpto 302, Miraflores, Lima",
      fechaServicio: daysAgo(0), status: "pendiente",
    }).returning();

    // Cancelled
    const [r35] = await db.insert(serviceRequestsTable).values({
      userId: cliente1.id, technicianId: tech3.id, serviceId: carpSvc.id,
      descripcion: "Reparación de mueble de cocina con cajones rotos.",
      direccion: "Av. Larco 456 Dpto 302, Miraflores, Lima",
      fechaServicio: daysAgo(75), status: "cancelada",
      motivoCancelacion: "El cliente tuvo que viajar de emergencia",
    }).returning();

    const [r36] = await db.insert(serviceRequestsTable).values({
      userId: cliente2.id, serviceId: pintSvc.id,
      descripcion: "Pintura rápida de habitación pequeña.",
      direccion: "Calle Los Robles 789, La Molina, Lima",
      fechaServicio: daysAgo(100), status: "cancelada",
      motivoCancelacion: "Encontró otro profesional",
    }).returning();

    // ─── PAYMENTS ─────────────────────────────────────────────────────────────
    const paymentRows = [
      { r: r1,  monto: "120.00", m: "yape" as const,    uid: cliente1.id, daysAgoN: 155 },
      { r: r2,  monto: "95.00",  m: "plin" as const,    uid: cliente2.id, daysAgoN: 150 },
      { r: r3,  monto: "80.00",  m: "yape" as const,    uid: cliente4.id, daysAgoN: 148 },
      { r: r4,  monto: "380.00", m: "tarjeta" as const, uid: cliente3.id, daysAgoN: 120 },
      { r: r5,  monto: "320.00", m: "yape" as const,    uid: cliente5.id, daysAgoN: 115 },
      { r: r6,  monto: "550.00", m: "tarjeta" as const, uid: cliente6.id, daysAgoN: 112 },
      { r: r7,  monto: "250.00", m: "yape" as const,    uid: cliente1.id, daysAgoN: 108 },
      { r: r8,  monto: "85.00",  m: "yape" as const,    uid: cliente2.id, daysAgoN: 90 },
      { r: r9,  monto: "140.00", m: "plin" as const,    uid: cliente7.id, daysAgoN: 88 },
      { r: r10, monto: "75.00",  m: "yape" as const,    uid: cliente3.id, daysAgoN: 85 },
      { r: r11, monto: "180.00", m: "plin" as const,    uid: cliente4.id, daysAgoN: 82 },
      { r: r12, monto: "420.00", m: "tarjeta" as const, uid: cliente8.id, daysAgoN: 78 },
      { r: r13, monto: "190.00", m: "tarjeta" as const, uid: cliente5.id, daysAgoN: 65 },
      { r: r14, monto: "150.00", m: "yape" as const,    uid: cliente6.id, daysAgoN: 62 },
      { r: r15, monto: "480.00", m: "tarjeta" as const, uid: cliente1.id, daysAgoN: 60 },
      { r: r16, monto: "160.00", m: "plin" as const,    uid: cliente7.id, daysAgoN: 58 },
      { r: r17, monto: "480.00", m: "tarjeta" as const, uid: cliente2.id, daysAgoN: 55 },
      { r: r18, monto: "220.00", m: "yape" as const,    uid: cliente8.id, daysAgoN: 50 },
      { r: r19, monto: "1800.00",m: "tarjeta" as const, uid: cliente3.id, daysAgoN: 42 },
      { r: r20, monto: "650.00", m: "tarjeta" as const, uid: cliente4.id, daysAgoN: 40 },
      { r: r21, monto: "350.00", m: "yape" as const,    uid: cliente5.id, daysAgoN: 38 },
      { r: r22, monto: "280.00", m: "plin" as const,    uid: cliente6.id, daysAgoN: 35 },
      { r: r23, monto: "390.00", m: "tarjeta" as const, uid: cliente7.id, daysAgoN: 32 },
      { r: r24, monto: "680.00", m: "yape" as const,    uid: cliente1.id, daysAgoN: 20 },
      { r: r25, monto: "750.00", m: "tarjeta" as const, uid: cliente8.id, daysAgoN: 18 },
      { r: r26, monto: "320.00", m: "plin" as const,    uid: cliente2.id, daysAgoN: 12 },
      { r: r27, monto: "260.00", m: "yape" as const,    uid: cliente3.id, daysAgoN: 10 },
      { r: r28, monto: "480.00", m: "tarjeta" as const, uid: cliente2.id, daysAgoN: 5 },
      { r: r29, monto: "380.00", m: "yape" as const,    uid: cliente4.id, daysAgoN: 2 },
    ];

    for (const p of paymentRows) {
      const createdAt = daysAgo(p.daysAgoN);
      await db.insert(paymentsTable).values({
        requestId: p.r.id, userId: p.uid,
        monto: p.monto, metodoPago: p.m,
        status: "completado", referencia: ref(),
        createdAt,
      });
    }

    // ─── REVIEWS ──────────────────────────────────────────────────────────────
    const reviewRows = [
      { r: r1,  uid: cliente1.id, tid: tech1.id, cal: 5, comment: "Carlos llegó puntual, diagnosticó el problema rápido y lo solucionó en 2 horas. Muy profesional y ordenado." },
      { r: r2,  uid: cliente2.id, tid: tech2.id, cal: 5, comment: "José es muy bueno en su trabajo. Identificó la fuga de inmediato y la reparó de forma definitiva. Precio justo." },
      { r: r3,  uid: cliente4.id, tid: tech7.id, cal: 5, comment: "Hugo llegó en 20 minutos. Cambió la cerradura rápidamente con material de primera calidad. Excelente servicio." },
      { r: r4,  uid: cliente3.id, tid: tech3.id, cal: 4, comment: "Buenos closets, trabajo prolijo. Hubo un pequeño retraso pero el resultado final fue excelente." },
      { r: r5,  uid: cliente5.id, tid: tech4.id, cal: 5, comment: "Ana es increíble. Dejó las paredes perfectas, colores exactos y todo muy limpio. La recomiendo totalmente." },
      { r: r6,  uid: cliente6.id, tid: tech9.id, cal: 5, comment: "Edgar transformó el baño completamente. Enchape perfecto, sin juntas desiguales. Trabajo de 10." },
      { r: r7,  uid: cliente1.id, tid: tech5.id, cal: 5, comment: "Roberto instaló el A/C perfectamente. Me explicó el uso del equipo y sistema. Muy recomendado." },
      { r: r8,  uid: cliente2.id, tid: tech1.id, cal: 5, comment: "Carlos solucionó el problema eléctrico rápido. Muy puntual y profesional. 100% recomendado." },
      { r: r9,  uid: cliente7.id, tid: tech8.id, cal: 4, comment: "Rosa dejó el jardín hermoso. Buen trabajo de poda y fertilización. Muy amable y puntual." },
      { r: r10, uid: cliente3.id, tid: tech2.id, cal: 4, comment: "Buen trabajo. José reparó todo con materiales de calidad. Llegó un poco tarde pero bien." },
      { r: r11, uid: cliente4.id, tid: tech6.id, cal: 5, comment: "Carmen dejó el departamento impecable. Limpieza muy a fondo y uso de productos de calidad." },
      { r: r12, uid: cliente8.id, tid: tech9.id, cal: 5, comment: "Edgar hizo un trabajo excelente con las fisuras. La impermeabilización quedó perfecta." },
      { r: r13, uid: cliente5.id, tid: tech1.id, cal: 5, comment: "Instalación eléctrica perfecta. Carlos es muy prolijo y deja todo limpio después del trabajo." },
      { r: r14, uid: cliente6.id, tid: tech7.id, cal: 5, comment: "Hugo instaló la chapa eléctrica en tiempo récord. Sistema de seguridad funcionando al 100%." },
      { r: r15, uid: cliente1.id, tid: tech3.id, cal: 5, comment: "Luis fabricó exactamente lo que pedí. La madera de primera calidad y el acabado impecable." },
      { r: r16, uid: cliente7.id, tid: tech5.id, cal: 4, comment: "Mantenimiento completo y profesional. Los equipos ahora enfrían mucho mejor." },
      { r: r17, uid: cliente2.id, tid: tech4.id, cal: 5, comment: "Ana es una artista. Las paredes quedaron perfectas y el trabajo fue muy ordenado." },
      { r: r18, uid: cliente8.id, tid: tech2.id, cal: 4, comment: "Instalación correcta de la terma. José explicó bien el uso y dejó todo ordenado." },
      { r: r20, uid: cliente4.id, tid: tech1.id, cal: 5, comment: "Sistema de seguridad instalado profesionalmente. Cámaras perfectamente ubicadas." },
      { r: r21, uid: cliente5.id, tid: tech8.id, cal: 5, comment: "Rosa diseñó un jardín hermoso en mi terraza. Muy creativa y con buen gusto." },
      { r: r22, uid: cliente6.id, tid: tech6.id, cal: 4, comment: "Oficina quedó impecable. Carmen usa muy buenos productos de limpieza." },
      { r: r23, uid: cliente7.id, tid: tech7.id, cal: 5, comment: "Control de acceso instalado perfectamente. Hugo es muy profesional y rápido." },
      { r: r24, uid: cliente1.id, tid: tech2.id, cal: 5, comment: "José instaló la terma solar de manera impecable. Ahorro notable en agua caliente." },
      { r: r25, uid: cliente8.id, tid: tech4.id, cal: 4, comment: "Pintura exterior de buena calidad. Ana usó pintura de primera y aplicó bien." },
      { r: r26, uid: cliente2.id, tid: tech5.id, cal: 5, comment: "Roberto instaló el minisplit con gran profesionalismo. Cero problemas desde el primer día." },
      { r: r27, uid: cliente3.id, tid: tech3.id, cal: 5, comment: "Luis reparó todo los muebles con acabado de lujo. Las sillas quedaron como nuevas." },
    ];

    for (const rev of reviewRows) {
      await db.insert(reviewsTable).values({
        requestId: rev.r.id, userId: rev.uid,
        technicianId: rev.tid, calificacion: rev.cal, comentario: rev.comment,
      });
    }

    // ─── UPDATE TECH STATS ────────────────────────────────────────────────────
    await db.update(techniciansTable).set({ promedioCalificacion: "4.90", totalTrabajos: 147 }).where(eq(techniciansTable.id, tech1.id));
    await db.update(techniciansTable).set({ promedioCalificacion: "4.85", totalTrabajos: 189 }).where(eq(techniciansTable.id, tech2.id));
    await db.update(techniciansTable).set({ promedioCalificacion: "4.80", totalTrabajos: 112 }).where(eq(techniciansTable.id, tech3.id));
    await db.update(techniciansTable).set({ promedioCalificacion: "4.75", totalTrabajos: 98  }).where(eq(techniciansTable.id, tech4.id));
    await db.update(techniciansTable).set({ promedioCalificacion: "4.88", totalTrabajos: 125 }).where(eq(techniciansTable.id, tech5.id));
    await db.update(techniciansTable).set({ promedioCalificacion: "4.60", totalTrabajos: 69  }).where(eq(techniciansTable.id, tech6.id));
    await db.update(techniciansTable).set({ promedioCalificacion: "4.92", totalTrabajos: 212 }).where(eq(techniciansTable.id, tech7.id));
    await db.update(techniciansTable).set({ promedioCalificacion: "4.70", totalTrabajos: 83  }).where(eq(techniciansTable.id, tech8.id));
    await db.update(techniciansTable).set({ promedioCalificacion: "4.82", totalTrabajos: 138 }).where(eq(techniciansTable.id, tech9.id));

    res.json({
      success: true,
      message: "Datos de demo cargados exitosamente",
      data: {
        usuarios: 20, tecnicos: 11, solicitudesTotal: 36,
        pagos: paymentRows.length, resenas: reviewRows.length,
      },
      credenciales: [
        { rol: "Administrador", email: "admin@fixya.com",    contrasena: "admin123"   },
        { rol: "Cliente",       email: "cliente@fixya.com",  contrasena: "cliente123" },
        { rol: "Técnico",       email: "tecnico@fixya.com",  contrasena: "tecnico123" },
      ],
    });
  } catch (err: any) {
    console.error("Seed error:", err);
    res.status(500).json({ error: "Error durante la carga de datos: " + err.message });
  }
});

export default router;
