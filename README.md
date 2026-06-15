# FixYa

> Plataforma web para contratar servicios técnicos del hogar (plomeros, electricistas, gasfiteros, etc.) con autenticación JWT, tres roles de usuario y reportes Excel.

**Repositorio:** https://github.com/Katherine-fe/fixya  
**Stack:** Java · Spring Boot · React · PostgreSQL

---

## Tabla de Contenidos

1. [Descripción del Producto](#descripción-del-producto)
2. [Patrones y Principios Aplicados](#patrones-y-principios-aplicados)
   - [MVC — Patrón Modelo-Vista-Controlador](#1-mvc--patrón-modelo-vista-controlador)
   - [SOLID — Principios de Diseño](#2-solid--principios-de-diseño)
   - [DAO — Data Access Object](#3-dao--data-access-object)
   - [TDD — Tests Unitarios](#4-tdd--tests-unitarios)
   - [Librerías Java Utilizadas](#5-librerías-java-utilizadas)
   - [Control de Versiones](#6-control-de-versiones)
   - [Interfaces Gráficas](#7-interfaces-gráficas)
3. [Arquitectura del Sistema](#arquitectura-del-sistema)
4. [Tecnologías Utilizadas](#tecnologías-utilizadas)
5. [Instalación y Ejecución Local](#instalación-y-ejecución-local)
6. [Credenciales de Demo](#credenciales-de-demo)
7. [Estructura del Proyecto](#estructura-del-proyecto)
8. [Endpoints de la API](#endpoints-de-la-api)

---

## Descripción del Producto

FixYa es una plataforma que conecta clientes peruanos con técnicos del hogar verificados. Los clientes pueden buscar técnicos por especialidad, ver perfiles con calificaciones y reseñas, solicitar servicios y pagar con Yape, Plin, tarjeta o efectivo.

**Roles del sistema:**
- **Usuario/Cliente** - busca técnicos, solicita servicios, realiza pagos y deja reseñas
- **Técnico** - gestiona su perfil, atiende solicitudes y ve sus ganancias
- **Administrador** - aprueba técnicos, ve estadísticas globales y descarga reportes Excel

---

## Patrones y Principios Aplicados

### 1. MVC — Patrón Modelo-Vista-Controlador

El backend está organizado siguiendo el patrón MVC en tres capas bien definidas:

| Capa | Ubicación | Clases |
|------|-----------|--------|
| **Modelo** | `java-backend/src/main/java/com/fixya/entity/` | `User.java`, `Technician.java`, `Service.java`, `ServiceRequest.java`, `Payment.java`, `Review.java` |
| **Vista** | `java-backend/src/main/java/com/fixya/dto/` | `AuthResponse.java`, `ApiResponse<T>.java` (respuestas JSON) |
| **Controlador** | `java-backend/src/main/java/com/fixya/controller/` | `AuthController.java`, `TechnicianController.java`, `ReportController.java`, `DashboardController.java` |

**Ejemplo de controlador:**
```java
// controller/AuthController.java
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(ApiResponse.ok("Login exitoso", response));
    }
}
```

El frontend (React) actúa como capa de presentación, separada completamente del backend:

| Capa | Ubicación | Archivos |
|------|-----------|----------|
| **Vista** | `artifacts/fixya/src/pages/` | `Home.tsx`, `Servicios.tsx`, `Tecnicos.tsx`, `Dashboard.tsx`, `Pagos.tsx` |
| **Componentes** | `artifacts/fixya/src/components/` | Navbar, Footer, modales, tarjetas |

---

### 2. SOLID — Principios de Diseño

| Principio | Aplicación en el código |
|-----------|------------------------|
| **S** — Responsabilidad única | `AuthService` solo autentica · `ReportService` solo genera Excel · `JwtUtil` solo maneja tokens |
| **O** — Abierto/cerrado | `ApiResponse<T>` genérico extensible sin modificación · `GlobalExceptionHandler` centraliza errores |
| **L** — Sustitución de Liskov | Repositorios JPA intercambiables por mocks en tests (`@Mock TechnicianRepository`) |
| **I** — Segregación de interfaces | Interfaces separadas por entidad: `UserRepository`, `TechnicianRepository`, `PaymentRepository`, etc. |
| **D** — Inversión de dependencias | Todos los servicios reciben sus dependencias por constructor, sin instanciarlas directamente |

**Ejemplo — Inversión de dependencias:**
```java
// service/AuthService.java
@Service
public class AuthService {
    private final UserRepository userRepository;   // interfaz, no implementación concreta
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    public AuthService(UserRepository userRepository,
                       PasswordEncoder passwordEncoder,
                       JwtUtil jwtUtil) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
    }
}
```

---

### 3. DAO — Data Access Object

El patrón DAO desacopla la lógica de negocio del acceso a datos mediante interfaces de repositorio con **Spring Data JPA**.

**6 repositorios implementados:**

```java
// repository/TechnicianRepository.java
@Repository
public interface TechnicianRepository extends JpaRepository<Technician, Integer> {

    List<Technician> findByStatus(Technician.TechnicianStatus status);

    @Query("SELECT t FROM Technician t WHERE t.status = 'aprobado' AND " +
           "(LOWER(t.especialidad) LIKE LOWER(CONCAT('%', :q, '%')))")
    List<Technician> searchApproved(@Param("q") String query);

    long countByStatus(Technician.TechnicianStatus status);
}
```

Cada entidad tiene su propio repositorio: `UserRepository`, `TechnicianRepository`, `ServiceRepository`, `ServiceRequestRepository`, `PaymentRepository`, `ReviewRepository`.

---

### 4. TDD — Tests Unitarios

**27 tests unitarios** escritos con JUnit 5 + Mockito.

| Archivo de Test | Tests | Qué verifica |
|-----------------|-------|--------------|
| `AuthServiceTest.java` | 5 | Login exitoso, email inexistente, password incorrecto, registro, email duplicado |
| `TechnicianServiceTest.java` | 6 | Listado con ImmutableList, búsqueda con/sin query, getById inexistente, approve, reject |
| `DashboardServiceTest.java` | 3 | Stats admin, cache Guava en segunda llamada, invalidación de cache |
| `JwtUtilTest.java` | 5 | Generación de token, validación token válido/inválido, extracción de userId y rol |
| `AppStringUtilsTest.java` | 8 | Capitalización, referencias de pago, truncado, normalización de email, formateo soles |

**Ejemplo de test:**
```java
@Test
@DisplayName("login falla con email inexistente")
void testLoginEmailInexistente() {
    // ARRANGE
    LoginRequest request = new LoginRequest();
    request.setEmail("noexiste@test.com");
    request.setPassword("cualquiera");
    when(userRepository.findByEmail("noexiste@test.com")).thenReturn(Optional.empty());

    // ACT & ASSERT
    assertThatThrownBy(() -> authService.login(request))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("Credenciales invalidas");
}
```

**Ejecutar los tests:**
```bash
cd java-backend
mvn test
```

---

### 5. Librerías Java Utilizadas

Todas declaradas en `java-backend/pom.xml`.

#### Logback — Logging estructurado

**Configuración:** `java-backend/src/main/resources/logback-spring.xml`

- Rolling appender diario con retención de 30 días
- Appender de auditoría de seguridad con retención de 90 días
- Colores ANSI en consola para desarrollo

```xml
<appender name="FILE" class="ch.qos.logback.core.rolling.RollingFileAppender">
    <file>logs/fixya.log</file>
    <rollingPolicy class="ch.qos.logback.core.rolling.TimeBasedRollingPolicy">
        <fileNamePattern>logs/fixya.%d{yyyy-MM-dd}.log</fileNamePattern>
        <maxHistory>30</maxHistory>
    </rollingPolicy>
</appender>
```

```java
private static final Logger log = LoggerFactory.getLogger(AuthService.class);
log.info("Login exitoso para usuario {} con rol {}", user.getId(), user.getRole());
log.warn("Token JWT invalido en request a {}", request.getRequestURI());
```

---

#### Apache Commons Lang3 — Utilidades de texto

**Archivo:** `java-backend/src/main/java/com/fixya/util/AppStringUtils.java`

```java
import org.apache.commons.lang3.StringUtils;
import org.apache.commons.lang3.RandomStringUtils;

// Capitalizar nombre completo
public static String formatNombreCompleto(String nombre, String apellido) {
    String n = StringUtils.capitalize(StringUtils.trimToEmpty(nombre).toLowerCase());
    String a = StringUtils.capitalize(StringUtils.trimToEmpty(apellido).toLowerCase());
    return StringUtils.joinWith(" ", n, a);
}

// Generar referencia de pago: FX-A3B7C2D9
public static String generarReferenciaPago() {
    return "FX-" + RandomStringUtils.randomAlphanumeric(8).toUpperCase();
}

// Normalizar email
String emailNorm = StringUtils.trimToEmpty(request.getEmail()).toLowerCase();
```

---

#### Apache Commons Collections4 — Colecciones avanzadas

```xml
<dependency>
    <groupId>org.apache.commons</groupId>
    <artifactId>commons-collections4</artifactId>
    <version>4.4</version>
</dependency>
```

Disponible para `MultiValuedMap`, `BiMap` y `Bag` en operaciones de agrupamiento de datos.

---

#### Apache Commons IO — Manejo de streams

**Archivo:** `java-backend/src/main/java/com/fixya/service/ReportService.java`

```java
import org.apache.commons.io.IOUtils;

ByteArrayOutputStream baos = new ByteArrayOutputStream();
workbook.write(baos);
byte[] result = baos.toByteArray();
IOUtils.closeQuietly(baos);   // cierra el stream sin lanzar excepción
```

---

#### Apache POI — Reportes Excel (.xlsx)

**Archivo:** `java-backend/src/main/java/com/fixya/service/ReportService.java`

Genera reportes descargables para el administrador:
- **Reporte de pagos** — cliente, monto, método y estado
- **Reporte de técnicos** — directorio completo con ratings y experiencia

```java
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.apache.poi.ss.usermodel.*;

public byte[] generatePaymentsReport() throws IOException {
    try (XSSFWorkbook workbook = new XSSFWorkbook()) {
        Sheet sheet = workbook.createSheet("Pagos FixYa");

        // Celda de título fusionada
        sheet.addMergedRegion(new CellRangeAddress(0, 0, 0, 6));

        // Estilos de encabezado (fondo azul, texto blanco, negrita)
        CellStyle headerStyle = createHeaderStyle(workbook);

        // Formato de moneda peruana
        DataFormat format = workbook.createDataFormat();
        style.setDataFormat(format.getFormat("S/ #,##0.00"));

        // Auto-ajuste de columnas
        for (int i = 0; i < headers.length; i++) sheet.autoSizeColumn(i);

        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        workbook.write(baos);
        return baos.toByteArray();
    }
}
```

**Endpoints de descarga:**
```
GET /api/reports/payments      → fixya-pagos-YYYY-MM-DD.xlsx
GET /api/reports/technicians   → fixya-tecnicos-YYYY-MM-DD.xlsx
```

---

#### Google Guava — Colecciones y utilidades

**Versión:** 33.1.0-jre

```java
// ImmutableList — lista inmutable para mayor seguridad
import com.google.common.collect.ImmutableList;

public ImmutableList<Map<String, Object>> listApproved() {
    return ImmutableList.copyOf(tecnicos.stream().map(this::toDetailMap).toList());
}

// LoadingCache — cache con TTL de 2 minutos para estadísticas
import com.google.common.cache.CacheBuilder;

private final Cache<String, Map<String, Object>> statsCache = CacheBuilder.newBuilder()
        .maximumSize(10)
        .expireAfterWrite(2, TimeUnit.MINUTES)
        .build();

// Preconditions — validación con mensajes claros
import com.google.common.base.Preconditions;

Preconditions.checkArgument(StringUtils.isNotBlank(request.getEmail()), "Email requerido");
Preconditions.checkArgument(request.getPassword().length() >= 6, "Minimo 6 caracteres");

// Stopwatch — medir tiempos de generación de reportes
Stopwatch stopwatch = Stopwatch.createStarted();
log.info("Reporte generado en {}ms", stopwatch.elapsed(TimeUnit.MILLISECONDS));

// ImmutableMap — mapa constante de etiquetas
public static final ImmutableMap<String, String> METODO_LABELS = ImmutableMap.of(
    "yape", "Yape", "plin", "Plin", "tarjeta", "Tarjeta", "efectivo", "Efectivo"
);
```

---

### 6. Control de Versiones

**Repositorio:** https://github.com/Katherine-fe/fixya

| # | Descripción del commit |
|---|------------------------|
| 1 | primer commit |
| 2 | subi el proyecto |
| 3 | empece con java y spring boot |
| 4 | modelos de la base de datos |
| 5 | repositorios para consultar datos |
| 6 | autenticacion con tokens jwt |
| 7 | logica de los servicios |
| 8 | generar reportes en excel |
| 9 | endpoints del api listos |
| 10 | pruebas unitarias |
| 11 | documentacion del proyecto |
| 12 | arregle el readme |
| 13 | readme listo |

---

### 7. Interfaces Gráficas

El frontend está construido con **React 19 + Vite + Tailwind CSS** con diseño glassmorphism en tonos azules.

| Pantalla | Ruta | Roles con acceso |
|----------|------|------------------|
| **Home** | `/` | Todos (pública) |
| **Catálogo de Servicios** | `/servicios` | Todos |
| **Directorio de Técnicos** | `/tecnicos` | Todos |
| **Perfil de Técnico** | `/tecnicos/:id` | Todos |
| **Login / Registro** | `/login`, `/registro` | No autenticados |
| **Dashboard Cliente** | `/dashboard` | usuario |
| **Dashboard Técnico** | `/dashboard` | tecnico |
| **Dashboard Administrador** | `/dashboard` | administrador |
| **Mis Pagos** | `/pagos` | usuario, tecnico |

**Funcionalidades por rol:**

- **Cliente:** buscar técnicos → solicitar servicio → pagar (Yape/Plin/Tarjeta/Efectivo) → dejar reseña
- **Técnico:** ver solicitudes pendientes → aceptar/rechazar → ver ganancias con gráfico de barras
- **Administrador:** estadísticas globales → aprobar/rechazar técnicos → descargar reportes Excel

---

## Arquitectura del Sistema

```
┌──────────────────────────────────────────┐
│              CLIENTE WEB                 │
│       React 19 + Vite + Tailwind         │
│       Wouter (routing) + Framer Motion   │
└─────────────────┬────────────────────────┘
                  │ HTTP/REST  (JWT Bearer)
                  ▼
┌──────────────────────────────────────────┐
│          BACKEND — Spring Boot 3.2       │
│  controller/ → service/ → repository/   │
│  Spring Security · JJWT · Guava · POI   │
└─────────────────┬────────────────────────┘
                  │
                  ▼
┌──────────────────────────────────────────┐
│              PostgreSQL                  │
│  users · technicians · services          │
│  requests · payments · reviews           │
└──────────────────────────────────────────┘
```

**Flujo de autenticación:**
1. Cliente envía `POST /api/auth/login` con email + password
2. `AuthService` verifica password con `BCryptPasswordEncoder`
3. `JwtUtil` genera token firmado
4. Frontend almacena el token y lo envía en cada request como `Authorization: Bearer <token>`
5. `JwtAuthFilter` valida el token antes de procesar cada request protegido

---

## Tecnologías Utilizadas

### Frontend
| Tecnología | Versión | Uso |
|-----------|---------|-----|
| React | 19 | Interfaz de usuario |
| Vite | 6 | Bundler y servidor de desarrollo |
| Tailwind CSS | 3 | Estilos utilitarios |
| Wouter | 3 | Routing |
| Framer Motion | 11 | Animaciones |
| Recharts | 2 | Gráficos de ganancias |

### Backend
| Tecnología | Versión | Uso |
|-----------|---------|-----|
| Java | 17 | Lenguaje principal |
| Spring Boot | 3.2.5 | Framework web |
| Spring Security | 6 | Autenticación y autorización |
| Spring Data JPA | 3.2 | Acceso a datos (patrón DAO) |
| JJWT | 0.12.5 | Generación y validación de tokens JWT |
| Logback | 1.4 | Logging con rolling appenders |
| Apache Commons Lang3 | 3.14 | StringUtils, RandomStringUtils |
| Apache Commons Collections4 | 4.4 | Colecciones avanzadas |
| Apache Commons IO | 2.15 | IOUtils para manejo de streams |
| Apache POI | 5.2.5 | Generación de reportes Excel |
| Google Guava | 33.1 | ImmutableList, Cache, Preconditions |
| JUnit 5 + Mockito | 5.x | Tests unitarios |
| Lombok | 1.18 | Reducción de boilerplate |

### Base de Datos
| Tecnología | Uso |
|-----------|-----|
| PostgreSQL 16 | Base de datos relacional |

---

## Instalación y Ejecución Local

### Requisitos previos
- [Java 17+](https://adoptium.net/)
- [Maven 3.9+](https://maven.apache.org/)
- [Node.js 20+](https://nodejs.org) *(para el frontend)*
- [pnpm](https://pnpm.io): `npm install -g pnpm` *(para el frontend)*
- [PostgreSQL 14+](https://www.postgresql.org/download/)

### Pasos

```bash
# 1. Clonar el repositorio
git clone https://github.com/Katherine-fe/fixya.git
cd fixya
```

**Crear la base de datos:**
```bash
createdb fixya
# (o en pgAdmin: Create Database → nombre: fixya)
```

**Configurar variables de entorno — crear archivo `.env` en la raíz:**
```env
DATABASE_URL=postgresql://postgres:TU_PASSWORD@localhost:5432/fixya
SESSION_SECRET=fixya-clave-secreta-2024
```

**Iniciar el backend Java (Terminal 1):**
```bash
cd java-backend
mvn spring-boot:run
# Disponible en: http://localhost:8081
```

**Iniciar el frontend (Terminal 2):**
```bash
cd fixya   # volver a la raíz
pnpm install
pnpm --filter @workspace/fixya run dev
# Disponible en: http://localhost:5173
```

**Tests:**
```bash
cd java-backend
mvn test                       # ejecutar tests
mvn surefire-report:report     # generar reporte HTML
```

---

## Credenciales de Demo

| Rol | Email | Contraseña |
|-----|-------|-----------|
| Administrador | admin@fixya.com | admin123 |
| Cliente | cliente@fixya.com | cliente123 |
| Técnico | tecnico@fixya.com | tecnico123 |

---

## Estructura del Proyecto

```
fixya/
├── README.md
│
├── java-backend/                        ← Backend principal (Spring Boot)
│   ├── pom.xml                          ← Dependencias Maven
│   └── src/
│       ├── main/java/com/fixya/
│       │   ├── entity/                  ← Modelo (6 entidades JPA)
│       │   │   ├── User.java
│       │   │   ├── Technician.java
│       │   │   ├── Service.java
│       │   │   ├── ServiceRequest.java
│       │   │   ├── Payment.java
│       │   │   └── Review.java
│       │   ├── repository/              ← DAO (6 repositorios Spring Data)
│       │   ├── service/                 ← Lógica de negocio
│       │   ├── controller/              ← Controladores REST
│       │   ├── security/                ← JWT Filter + Spring Security
│       │   ├── dto/                     ← Objetos de transferencia de datos
│       │   └── util/
│       │       └── AppStringUtils.java  ← Guava + Apache Commons
│       └── main/resources/
│           ├── application.properties
│           └── logback-spring.xml       ← Configuración de logging
│
├── artifacts/
│   └── fixya/                           ← Frontend React
│       └── src/
│           ├── pages/                   ← Vistas (Home, Servicios, Técnicos, Dashboard...)
│           ├── components/              ← Componentes reutilizables
│           └── lib/api.ts               ← Cliente HTTP con JWT
│
└── lib/
    └── db/src/schema/                   ← Esquema de la base de datos
```

---

## Endpoints de la API

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| `POST` | `/api/auth/login` | No | Iniciar sesión |
| `POST` | `/api/auth/register` | No | Registrar usuario |
| `GET` | `/api/auth/me` | Sí | Perfil del usuario actual |
| `GET` | `/api/services` | No | Catálogo de servicios |
| `GET` | `/api/technicians` | No | Listado de técnicos aprobados |
| `GET` | `/api/technicians/:id` | No | Perfil de técnico con reseñas |
| `POST` | `/api/requests` | usuario | Crear solicitud de servicio |
| `GET` | `/api/requests/my` | Sí | Mis solicitudes |
| `POST` | `/api/payments` | usuario | Procesar pago |
| `GET` | `/api/payments/my` | usuario | Mis pagos |
| `GET` | `/api/payments/my-earnings` | tecnico | Ganancias del técnico |
| `POST` | `/api/reviews` | usuario | Dejar reseña |
| `GET` | `/api/dashboard/usuario` | usuario | Estadísticas del cliente |
| `GET` | `/api/dashboard/tecnico` | tecnico | Estadísticas del técnico |
| `GET` | `/api/dashboard/admin` | administrador | Estadísticas globales |
| `PATCH` | `/api/admin/technicians/:id/approve` | administrador | Aprobar técnico |
| `GET` | `/api/reports/payments` | administrador | Descargar reporte pagos (.xlsx) |
| `GET` | `/api/reports/technicians` | administrador | Descargar reporte técnicos (.xlsx) |

---

*FixYa — Proyecto universitario realizado por Katherine Vanessa Serrano Asan · Java Spring Boot · React · PostgreSQL*
