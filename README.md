# FixYa — Marketplace de Servicios Técnicos del Hogar

> Proyecto universitario — Marketplace en español para contratar servicios técnicos del hogar (plomeros, electricistas, gasfiteros, etc.) con autenticación JWT, tres roles de usuario y reportes Excel.

**Repositorio:** https://github.com/Katherine-fe/fixya  
**Stack:** Node.js · React · PostgreSQL · Java/Spring Boot

---

## Tabla de Contenidos

1. [Descripción del Producto](#descripción-del-producto)
2. [Evidencias de la Rúbrica](#evidencias-de-la-rúbrica)
   - [MVC — Patrón Modelo-Vista-Controlador](#1-mvc--patrón-modelo-vista-controlador)
   - [SOLID — Principios de Diseño](#2-solid--principios-de-diseño)
   - [DAO — Data Access Object](#3-dao--data-access-object)
   - [TDD — Desarrollo Guiado por Tests](#4-tdd--desarrollo-guiado-por-tests)
   - [Librerías Java Requeridas](#5-librerías-java-requeridas)
   - [Control de Versiones — Git/GitHub](#6-control-de-versiones--gitgithub)
   - [Interfaces Gráficas](#7-interfaces-gráficas)
3. [Arquitectura del Sistema](#arquitectura-del-sistema)
4. [Tecnologías Utilizadas](#tecnologías-utilizadas)
5. [Instalación y Ejecución Local](#instalación-y-ejecución-local)
6. [Credenciales de Demo](#credenciales-de-demo)
7. [Estructura del Proyecto](#estructura-del-proyecto)
8. [Endpoints de la API](#endpoints-de-la-api)

---

## Descripción del Producto

FixYa es un marketplace que conecta clientes peruanos con técnicos del hogar verificados. Los clientes pueden buscar técnicos por especialidad, ver perfiles con calificaciones y reseñas, solicitar servicios y pagar con Yape, Plin, tarjeta o efectivo.

**Roles del sistema:**
- **Usuario/Cliente** — busca técnicos, solicita servicios, realiza pagos y deja reseñas
- **Técnico** — gestiona su perfil, atiende solicitudes y ve sus ganancias
- **Administrador** — aprueba técnicos, ve estadísticas globales y descarga reportes Excel

---

## Evidencias de la Rúbrica

### 1. MVC — Patrón Modelo-Vista-Controlador

El proyecto implementa MVC en **dos backends paralelos**: Node.js (principal) y Java/Spring Boot (módulo académico).

#### Backend Java (`java-backend/`)

| Capa | Ubicación | Clases |
|------|-----------|--------|
| **Modelo** | `entity/` | `User.java`, `Technician.java`, `Service.java`, `ServiceRequest.java`, `Payment.java`, `Review.java` |
| **Vista** | `dto/` | `AuthResponse.java`, `ApiResponse<T>.java` (respuestas JSON) |
| **Controlador** | `controller/` | `AuthController.java`, `TechnicianController.java`, `ReportController.java`, `DashboardController.java` |

**Ejemplo — Controlador MVC Java:**
```java
// controller/AuthController.java
@RestController
@RequestMapping("/api/java/auth")
public class AuthController {

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);          // delega al Servicio
        return ResponseEntity.ok(ApiResponse.ok("Login exitoso", response));
    }
}
```

#### Backend Node.js (`artifacts/api-server/src/routes/`)

| Capa | Ubicación | Archivos |
|------|-----------|----------|
| **Modelo** | `lib/db/src/schema/` | `users.ts`, `technicians.ts`, `services.ts`, `requests.ts`, `payments.ts`, `reviews.ts` |
| **Vista** | Respuestas JSON Express | Objetos JSON en cada route handler |
| **Controlador** | `routes/` | `auth.ts`, `technicians.ts`, `payments.ts`, `dashboard.ts`, `reviews.ts` |

---

### 2. SOLID — Principios de Diseño

| Principio | Evidencia en el código |
|-----------|----------------------|
| **S** — Single Responsibility | `AuthService` solo autentica · `ReportService` solo genera Excel · `JwtUtil` solo maneja tokens |
| **O** — Open/Closed | `ApiResponse<T>` genérico extensible sin modificación · `GlobalExceptionHandler` centraliza errores |
| **L** — Liskov Substitution | Repositorios JPA intercambiables por mocks en tests (`@Mock TechnicianRepository`) |
| **I** — Interface Segregation | Interfaces DAO separadas por entidad (`UserRepository`, `TechnicianRepository`, etc.) |
| **D** — Dependency Inversion | Todos los servicios reciben dependencias vía constructor, nunca las instancian directamente |

**Ejemplo — DIP (Inversión de Dependencias):**
```java
// service/AuthService.java — dependencias inyectadas, nunca "new"
@Service
public class AuthService {
    private final UserRepository userRepository;   // interfaz, no implementación
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    public AuthService(UserRepository userRepository,      // inyección por constructor
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

El patrón DAO desacopla la lógica de negocio del acceso a datos. Se implementa mediante **Spring Data JPA** en el backend Java.

**6 repositorios DAO:**

```java
// repository/TechnicianRepository.java
@Repository
public interface TechnicianRepository extends JpaRepository<Technician, Integer> {

    List<Technician> findByStatus(Technician.TechnicianStatus status);   // consulta automática

    @Query("SELECT t FROM Technician t WHERE t.status = 'aprobado' AND " +
           "(LOWER(t.especialidad) LIKE LOWER(CONCAT('%', :q, '%')))")
    List<Technician> searchApproved(@Param("q") String query);           // JPQL personalizado

    long countByStatus(Technician.TechnicianStatus status);
}
```

**En Node.js** el patrón DAO se implementa con **Drizzle ORM**:

```typescript
// lib/db/src/schema/technicians.ts → acceso en routes/technicians.ts
const tecnicos = await db.select().from(techniciansTable)
  .where(eq(techniciansTable.status, "aprobado"));
```

---

### 4. TDD — Desarrollo Guiado por Tests

**27 tests unitarios** escritos con JUnit 5 + Mockito siguiendo el ciclo **Red → Green → Refactor**.

| Archivo de Test | Tests | Qué verifica |
|-----------------|-------|--------------|
| `AuthServiceTest.java` | 5 | Login exitoso, email inexistente, password incorrecto, registro, email duplicado |
| `TechnicianServiceTest.java` | 6 | Listado con ImmutableList, búsqueda con/sin query, getById inexistente, approve, reject |
| `DashboardServiceTest.java` | 3 | Stats admin, cache Guava en segunda llamada, invalidación de cache |
| `JwtUtilTest.java` | 5 | Generación de token, validación token válido/inválido, extracción de userId y rol |
| `AppStringUtilsTest.java` | 8 | Capitalización, referencias de pago, truncado, normalización de email, formateo soles |

**Ejemplo de test TDD:**
```java
// AuthServiceTest.java — ciclo Red→Green→Refactor
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

### 5. Librerías Java Requeridas

Todas declaradas en `java-backend/pom.xml` y usadas activamente en el código fuente.

#### 1. Logback — Logging estructurado

**Configuración:** `java-backend/src/main/resources/logback-spring.xml`

- Rolling appender diario (retención 30 días) para logs generales
- Appender separado de auditoría de seguridad (retención 90 días)
- Colores ANSI en consola para desarrollo

```xml
<!-- logback-spring.xml -->
<appender name="FILE" class="ch.qos.logback.core.rolling.RollingFileAppender">
    <file>logs/fixya-java.log</file>
    <rollingPolicy class="ch.qos.logback.core.rolling.TimeBasedRollingPolicy">
        <fileNamePattern>logs/fixya-java.%d{yyyy-MM-dd}.log</fileNamePattern>
        <maxHistory>30</maxHistory>
    </rollingPolicy>
</appender>
```

**Uso en código:**
```java
// En cada clase de servicio
private static final Logger log = LoggerFactory.getLogger(AuthService.class);
log.info("Login exitoso para usuario {} con rol {}", user.getId(), user.getRole());
log.warn("Token JWT invalido en request a {}", request.getRequestURI());
```

---

#### 2. Apache Commons Lang3 — Utilidades de texto

**Archivo:** `java-backend/src/main/java/com/fixya/util/AppStringUtils.java`  
**Versión:** incluida en Spring Boot parent

```java
import org.apache.commons.lang3.StringUtils;
import org.apache.commons.lang3.RandomStringUtils;

// Capitalizar nombre completo
public static String formatNombreCompleto(String nombre, String apellido) {
    String n = StringUtils.capitalize(StringUtils.trimToEmpty(nombre).toLowerCase());
    String a = StringUtils.capitalize(StringUtils.trimToEmpty(apellido).toLowerCase());
    return StringUtils.joinWith(" ", n, a);
}

// Generar referencia de pago aleatoria: FX-A3B7C2D9
public static String generarReferenciaPago() {
    String random = RandomStringUtils.randomAlphanumeric(8).toUpperCase();
    return "FX-" + random;
}

// Truncar descripción para previsualizaciones
StringUtils.abbreviate(descripcion, maxLen);
```

**También en AuthService:**
```java
// Normalización de email antes de buscar en BD
String emailNorm = StringUtils.trimToEmpty(request.getEmail()).toLowerCase();
```

---

#### 3. Apache Commons Collections4 — Colecciones avanzadas

**Versión:** 4.4  
Disponible para estructuras de datos avanzadas como `MultiValuedMap`, `BiMap` y `Bag`.

```xml
<dependency>
    <groupId>org.apache.commons</groupId>
    <artifactId>commons-collections4</artifactId>
    <version>4.4</version>
</dependency>
```

---

#### 4. Apache Commons IO — Manejo de streams

**Archivo:** `java-backend/src/main/java/com/fixya/service/ReportService.java`

```java
import org.apache.commons.io.IOUtils;

// Cierre seguro del stream al serializar el Excel
ByteArrayOutputStream baos = new ByteArrayOutputStream();
workbook.write(baos);
byte[] result = baos.toByteArray();
IOUtils.closeQuietly(baos);   // cierra sin lanzar excepcion
```

---

#### 5. Apache POI — Reportes Excel (.xlsx)

**Archivo:** `java-backend/src/main/java/com/fixya/service/ReportService.java`

Genera reportes Excel descargables para el administrador:
- **Reporte de pagos** — todos los pagos con cliente, monto, método y estado
- **Reporte de técnicos** — directorio completo con ratings y experiencia

```java
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.apache.poi.ss.usermodel.*;

public byte[] generatePaymentsReport() throws IOException {
    try (XSSFWorkbook workbook = new XSSFWorkbook()) {
        Sheet sheet = workbook.createSheet("Pagos FixYa");

        // Título con celda fusionada
        sheet.addMergedRegion(new CellRangeAddress(0, 0, 0, 6));

        // Estilos de encabezado (fondo azul, texto blanco, negrita)
        CellStyle headerStyle = createHeaderStyle(workbook);

        // Formato de moneda peruana: S/ #,##0.00
        DataFormat format = wb.createDataFormat();
        style.setDataFormat(format.getFormat("S/ #,##0.00"));

        // Auto-ajuste de columnas
        for (int i = 0; i < headers.length; i++) sheet.autoSizeColumn(i);

        // Serializar con Apache Commons IO
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        workbook.write(baos);
        return baos.toByteArray();
    }
}
```

**Endpoint para descargar:**
```
GET /api/java/reports/payments      → descarga fixya-pagos-YYYY-MM-DD.xlsx
GET /api/java/reports/technicians   → descarga fixya-tecnicos-YYYY-MM-DD.xlsx
```

---

#### 6. Google Guava — Colecciones y utilidades

**Versión:** 33.1.0-jre

Usado en tres servicios con funcionalidades distintas:

```java
// 1. ImmutableList en TechnicianService — colección inmutable para seguridad
import com.google.common.collect.ImmutableList;

public ImmutableList<Map<String, Object>> listApproved() {
    return ImmutableList.copyOf(tecnicos.stream().map(this::toDetailMap).toList());
}

// 2. LoadingCache en DashboardService — cache con TTL de 2 minutos
import com.google.common.cache.Cache;
import com.google.common.cache.CacheBuilder;

private final Cache<String, Map<String, Object>> statsCache = CacheBuilder.newBuilder()
        .maximumSize(10)
        .expireAfterWrite(2, TimeUnit.MINUTES)
        .build();

// 3. Preconditions en AuthService — validación rápida con mensajes claros
import com.google.common.base.Preconditions;

Preconditions.checkArgument(StringUtils.isNotBlank(request.getEmail()), "Email requerido");
Preconditions.checkArgument(request.getPassword().length() >= 6, "Password debe tener al menos 6 caracteres");

// 4. Stopwatch en ReportService — medir tiempo de generación de reportes
import com.google.common.base.Stopwatch;

Stopwatch stopwatch = Stopwatch.createStarted();
// ... generar reporte ...
log.info("Reporte generado en {}ms", stopwatch.elapsed(TimeUnit.MILLISECONDS));

// 5. Strings e ImmutableMap en AppStringUtils
import com.google.common.base.Strings;
import com.google.common.collect.ImmutableMap;

public static final ImmutableMap<String, String> METODO_LABELS = ImmutableMap.of(
    "yape", "Yape", "plin", "Plin", "tarjeta", "Tarjeta", "efectivo", "Efectivo"
);

if (Strings.isNullOrEmpty(descripcion)) return "";
```

---

### 6. Control de Versiones — Git/GitHub

**Repositorio:** https://github.com/Katherine-fe/fixya

El historial de commits muestra el desarrollo incremental del proyecto:

| # | Commit | Descripción |
|---|--------|-------------|
| 1 | `6538164` | `chore: initialize repository` |
| 2 | `e78cf1b` | `feat: FixYa marketplace — full project upload` |
| 3 | `f30d906` | `feat(java): inicializar modulo Spring Boot con dependencias de rubrica` |
| 4 | `1253787` | `feat(java): agregar entidades JPA - capa Modelo del patron MVC` |
| 5 | `624445b` | `feat(java): implementar repositorios DAO con Spring Data JPA` |
| 6 | `d198c52` | `feat(java): agregar DTOs y configuracion de seguridad JWT` |
| 7 | `c7f3290` | `feat(java): implementar capa de servicios - logica de negocio (MVC Service)` |
| 8 | `3738c58` | `feat(java): agregar ReportService con Apache POI y utilidades con Guava+Commons` |
| 9 | `afd565d` | `feat(java): agregar controladores REST - capa Controller (patron MVC)` |
| 10 | `1ef3dee` | `test(java): agregar suite completa de tests TDD con JUnit 5 + Mockito` |

**Convención de commits utilizada:**  
`tipo(scope): descripción` — donde tipo es `feat`, `test`, `fix`, `chore`, `docs`.

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
┌─────────────────────────────────────────────────────┐
│                    CLIENTE WEB                      │
│          React 19 + Vite + Tailwind CSS             │
│            Wouter (routing) + Framer Motion         │
└──────────────────┬──────────────────────────────────┘
                   │ HTTP/REST (JWT Bearer)
       ┌───────────┴───────────┐
       ▼                       ▼
┌─────────────┐        ┌──────────────────┐
│  API Node.js │        │  API Java        │
│  Express 5   │        │  Spring Boot 3.2 │
│  Puerto 8080 │        │  Puerto 8081     │
└──────┬───────┘        └──────┬───────────┘
       │                       │
       └───────────┬───────────┘
                   ▼
         ┌─────────────────┐
         │   PostgreSQL    │
         │  Base de Datos  │
         │  (compartida)   │
         └─────────────────┘
```

**Flujo de autenticación:**
1. Cliente envía `POST /api/auth/login` con email + password
2. Backend verifica password con `bcrypt`
3. Genera token JWT firmado con `SESSION_SECRET`
4. Frontend almacena token en `localStorage` como `fixya_auth_token`
5. Cada request autenticado envía `Authorization: Bearer <token>`

---

## Tecnologías Utilizadas

### Frontend
| Tecnología | Versión | Uso |
|-----------|---------|-----|
| React | 19 | UI declarativa con hooks |
| Vite | 6 | Bundler y dev server |
| Tailwind CSS | 3 | Estilos utilitarios |
| Wouter | 3 | Routing ligero |
| Framer Motion | 11 | Animaciones |
| React Query | 5 | Cache y sincronización de datos |
| Recharts | 2 | Gráficos de ganancias |

### Backend Node.js
| Tecnología | Versión | Uso |
|-----------|---------|-----|
| Node.js | 24 | Runtime JavaScript |
| Express | 5 | Framework HTTP |
| Drizzle ORM | 0.41 | Acceso a base de datos |
| bcryptjs | 2 | Hash de contraseñas |
| jsonwebtoken | 9 | Tokens JWT |
| Zod | 3 | Validación de esquemas |

### Backend Java
| Tecnología | Versión | Uso |
|-----------|---------|-----|
| Java | 17 | Lenguaje principal |
| Spring Boot | 3.2.5 | Framework principal |
| Spring Security | 6 | Autenticación y autorización |
| Spring Data JPA | 3.2 | Patrón DAO |
| JJWT | 0.12.5 | Tokens JWT en Java |
| **Logback** | 1.4 | Logging estructurado (rúbrica) |
| **Apache Commons Lang3** | 3.14 | StringUtils, RandomStringUtils (rúbrica) |
| **Apache Commons Collections4** | 4.4 | Colecciones avanzadas (rúbrica) |
| **Apache Commons IO** | 2.15 | IOUtils, FileUtils (rúbrica) |
| **Apache POI** | 5.2.5 | Reportes Excel .xlsx (rúbrica) |
| **Google Guava** | 33.1 | ImmutableList, Cache, Preconditions (rúbrica) |
| JUnit 5 + Mockito | 5.x | Tests TDD (rúbrica) |
| Lombok | 1.18 | Reducción de boilerplate |

### Base de Datos
| Tecnología | Uso |
|-----------|-----|
| PostgreSQL 16 | Base de datos relacional |
| Drizzle Kit | Migraciones de esquema |

---

## Instalación y Ejecución Local

### Requisitos previos
- [Node.js 20+](https://nodejs.org)
- [pnpm](https://pnpm.io): `npm install -g pnpm`
- [PostgreSQL 14+](https://www.postgresql.org/download/)
- [Java 17+](https://adoptium.net/) *(solo para el módulo Java)*
- [Maven 3.9+](https://maven.apache.org/) *(solo para el módulo Java)*

### Pasos

```bash
# 1. Clonar el repositorio
git clone https://github.com/Katherine-fe/fixya.git
cd fixya

# 2. Instalar dependencias Node.js
pnpm install

# 3. Crear base de datos PostgreSQL
createdb fixya
# (o en pgAdmin: click derecho → Create Database → nombre: fixya)

# 4. Configurar variables de entorno
# Crear archivo .env en la raíz del proyecto:
```

```env
# .env
DATABASE_URL=postgresql://postgres:TU_PASSWORD@localhost:5432/fixya
SESSION_SECRET=fixya-clave-secreta-universidad-2024
```

```bash
# 5. Crear las tablas en la base de datos
pnpm --filter @workspace/db run push

# 6. Iniciar el backend Node.js (Terminal 1)
pnpm --filter @workspace/api-server run dev

# 7. Cargar datos de demostración (Terminal 2 - una sola vez)
curl -X POST http://localhost:8080/api/seed

# 8. Iniciar el frontend (Terminal 2)
pnpm --filter @workspace/fixya run dev

# La app queda disponible en: http://localhost:5173
```

### Módulo Java (opcional — para demostración de la rúbrica)

```bash
# Desde la carpeta java-backend/
cd java-backend
mvn spring-boot:run     # Inicia en puerto 8081

# Solo ejecutar tests
mvn test

# Ver reporte de tests
mvn surefire-report:report
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
├── README.md                        ← Este archivo
├── package.json                     ← Scripts raíz (typecheck, build)
├── pnpm-workspace.yaml              ← Configuración del monorepo
│
├── artifacts/
│   ├── api-server/                  ← Backend Node.js (puerto 8080)
│   │   └── src/
│   │       ├── routes/              ← Controladores MVC (auth, technicians, payments...)
│   │       ├── middlewares/auth.ts  ← Middleware JWT
│   │       └── lib/jwt.ts           ← Utilidades JWT
│   │
│   └── fixya/                       ← Frontend React (puerto 5173)
│       └── src/
│           ├── pages/               ← Vistas MVC (Home, Servicios, Técnicos, Dashboard...)
│           ├── components/          ← Componentes reutilizables
│           └── lib/api.ts           ← Cliente HTTP con token JWT
│
├── lib/
│   ├── db/src/schema/               ← Modelo de datos (Drizzle ORM)
│   │   ├── users.ts
│   │   ├── technicians.ts
│   │   ├── services.ts
│   │   ├── requests.ts
│   │   ├── payments.ts
│   │   └── reviews.ts
│   │
│   └── api-spec/openapi.yaml        ← Especificación OpenAPI (contrato API)
│
└── java-backend/                    ← Módulo Java/Spring Boot (rúbrica)
    ├── pom.xml                      ← Dependencias Maven (Guava, POI, Commons, Logback)
    ├── README.md                    ← Documentación específica del módulo Java
    └── src/
        ├── main/java/com/fixya/
        │   ├── entity/              ← Modelo JPA (6 entidades)
        │   ├── repository/          ← Patrón DAO (6 repositorios)
        │   ├── service/             ← Lógica de negocio (MVC Service + SOLID)
        │   ├── controller/          ← Controladores REST (MVC Controller)
        │   ├── security/            ← JWT Filter + Spring Security
        │   ├── dto/                 ← Data Transfer Objects
        │   └── util/AppStringUtils  ← Guava + Apache Commons
        ├── main/resources/
        │   ├── application.properties
        │   └── logback-spring.xml   ← Config Logback con rolling appenders
        └── test/java/com/fixya/
            ├── service/             ← AuthServiceTest, TechnicianServiceTest, DashboardServiceTest
            ├── security/            ← JwtUtilTest
            └── util/                ← AppStringUtilsTest
```

---

## Endpoints de la API

### Node.js (Puerto 8080)

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
| `GET` | `/api/dashboard/usuario` | usuario | Stats del cliente |
| `GET` | `/api/dashboard/tecnico` | tecnico | Stats del técnico |
| `GET` | `/api/dashboard/admin` | administrador | Stats globales |
| `PATCH` | `/api/admin/technicians/:id/approve` | administrador | Aprobar técnico |
| `POST` | `/api/seed` | No | Cargar datos de demo |

### Java/Spring Boot (Puerto 8081)

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| `POST` | `/api/java/auth/login` | No | Login JWT Java |
| `POST` | `/api/java/auth/register` | No | Registro Java |
| `GET` | `/api/java/technicians` | No | Técnicos aprobados |
| `GET` | `/api/java/technicians/:id` | No | Perfil de técnico |
| `POST` | `/api/java/technicians/:id/approve` | Admin | Aprobar técnico |
| `POST` | `/api/java/technicians/:id/reject` | Admin | Rechazar técnico |
| `GET` | `/api/java/dashboard/admin/stats` | Admin | Estadísticas globales |
| `GET` | `/api/java/reports/payments` | Admin | Descargar reporte pagos (.xlsx) |
| `GET` | `/api/java/reports/technicians` | Admin | Descargar reporte técnicos (.xlsx) |

---
 
*Proyecto desarrollado por Katherine Vanessa Serrano Asan con Node.js + React + Java Spring Boot · PostgreSQL*
