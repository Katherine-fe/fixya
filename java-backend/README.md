# FixYa — Backend Java/Spring Boot

Módulo Java del marketplace **FixYa** para servicios técnicos del hogar.
Implementado con **Spring Boot 3.2 + Java 17** como complemento al backend Node.js.

## Arquitectura y Patrones (Rúbrica)

### MVC (Model-View-Controller)
| Capa | Paquete | Clases |
|------|---------|--------|
| **Modelo** | `entity/` | `User`, `Technician`, `Service`, `ServiceRequest`, `Payment`, `Review` |
| **Vista** | DTOs JSON | `AuthResponse`, `ApiResponse<T>` |
| **Controlador** | `controller/` | `AuthController`, `TechnicianController`, `ReportController`, `DashboardController` |

### SOLID
- **SRP** — cada clase tiene una sola responsabilidad (`AuthService` solo autentica, `ReportService` solo genera Excel)
- **OCP** — `ApiResponse<T>` genérico extensible sin modificación
- **LSP** — repositorios JPA intercambiables por implementaciones de test
- **ISP** — interfaces DAO separadas por entidad
- **DIP** — inyección de dependencias vía constructor en todos los servicios

### DAO (Data Access Object)
Todos los repositorios en `repository/` implementan el patrón DAO mediante JPA:
- `UserRepository`, `TechnicianRepository`, `ServiceRepository`
- `ServiceRequestRepository`, `PaymentRepository`, `ReviewRepository`

### TDD (Test Driven Development)
Tests con JUnit 5 + Mockito (Red → Green → Refactor):
- `AuthServiceTest` — 5 tests (login, registro, validaciones)
- `TechnicianServiceTest` — 6 tests (listado, búsqueda, aprobación)
- `DashboardServiceTest` — 3 tests (stats, cache Guava)
- `JwtUtilTest` — 5 tests (generación, validación, claims)
- `AppStringUtilsTest` — 8 tests (formato, truncado, validación)

## Librerías Requeridas

| Librería | Uso en el proyecto |
|---------|-------------------|
| **Logback** | Logging estructurado con 2 appenders de rotación (general + seguridad) |
| **Apache Commons Lang3** | `StringUtils.capitalize`, `trimToEmpty`, `abbreviate`, `RandomStringUtils` |
| **Apache Commons Collections4** | Disponible en `AppStringUtils` para estructuras de colecciones avanzadas |
| **Apache Commons IO** | `IOUtils.closeQuietly` al serializar workbooks Excel |
| **Apache POI** | `XSSFWorkbook` — genera reportes `.xlsx` con estilos, fusión de celdas, autofit |
| **Google Guava** | `ImmutableList`, `LoadingCache` (TTL 2 min), `Preconditions`, `Stopwatch`, `Strings` |

## Estructura del Proyecto

```
java-backend/
├── pom.xml                          # Dependencias Maven
├── src/
│   ├── main/
│   │   ├── java/com/fixya/
│   │   │   ├── FixyaApplication.java
│   │   │   ├── entity/              # Modelo JPA
│   │   │   ├── repository/          # DAO Repositories
│   │   │   ├── service/             # Lógica de negocio
│   │   │   ├── controller/          # REST Controllers
│   │   │   ├── security/            # JWT + Spring Security
│   │   │   ├── dto/                 # Data Transfer Objects
│   │   │   └── util/                # Utilidades (Guava + Commons)
│   │   └── resources/
│   │       ├── application.properties
│   │       └── logback-spring.xml   # Config Logback con rolling appenders
│   └── test/
│       └── java/com/fixya/
│           ├── service/             # Tests TDD servicios
│           ├── security/            # Tests TDD JWT
│           └── util/                # Tests TDD utilidades
```

## Ejecutar

```bash
# Desde la raíz del proyecto
cd java-backend
mvn spring-boot:run

# Solo tests
mvn test

# Compilar y empaquetar
mvn clean package -DskipTests
```

## Endpoints REST

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| `POST` | `/api/java/auth/login` | No | Autenticación JWT |
| `POST` | `/api/java/auth/register` | No | Registro de usuario |
| `GET` | `/api/java/technicians` | No | Listado de técnicos aprobados |
| `GET` | `/api/java/technicians/{id}` | No | Perfil de técnico |
| `POST` | `/api/java/technicians/{id}/approve` | Admin | Aprobar técnico |
| `POST` | `/api/java/technicians/{id}/reject` | Admin | Rechazar técnico |
| `GET` | `/api/java/dashboard/admin/stats` | Admin | Estadísticas globales |
| `GET` | `/api/java/reports/payments` | Admin | Descargar reporte pagos (.xlsx) |
| `GET` | `/api/java/reports/technicians` | Admin | Descargar reporte técnicos (.xlsx) |

## Credenciales de Demo

| Rol | Email | Password |
|-----|-------|----------|
| Administrador | admin@fixya.com | admin123 |
| Cliente | cliente@fixya.com | cliente123 |
| Técnico | tecnico@fixya.com | tecnico123 |
