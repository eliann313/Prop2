# Prop² — Plataforma Inmobiliaria Full-Stack

Plataforma de publicación, venta y alquiler de inmuebles en Argentina: los propietarios publican directamente y los interesados contactan sin intermediarios.

> **Estado del Proyecto: V1 Completa (Etapas 0 a 5 finalizadas, Etapa 6 en cierre)**  
> Infraestructura, modelo de datos relacional, autenticación end-to-end, CRUD de publicaciones con wizard de 4 pasos y geocoding, búsqueda pública combinada con mapa interactivo Leaflet/OSM, IA multiproveedor en cascada, panel de administración con moderación proactiva, hardening completo de seguridad (CSP, HIBP, ReDoS, Rate Limiting), SEO técnico dinámico y suite de testing automatizada (Vitest + Playwright E2E).

---

## 🛠️ Stack Tecnológico

| Capa                       | Tecnología                                  | Justificación                                                                            |
| :------------------------- | :------------------------------------------ | :--------------------------------------------------------------------------------------- |
| **Framework Full-Stack**   | Next.js 16 (App Router) + React 19          | SSR/ISR nativo, Server Components, Server Actions y Route Handlers sin backend separado. |
| **Lenguaje**               | TypeScript                                  | Tipado estricto end-to-end (cliente y servidor).                                         |
| **Base de datos**          | PostgreSQL en Neon                          | Database serverless con branching gratuito.                                              |
| **ORM**                    | Prisma 7 (Driver adapter de Neon)           | DX superior, migración versionada y tipado autogenerado.                                 |
| **Autenticación**          | Auth.js v5 (NextAuth)                       | Self-hosted, gratis sin límite de usuarios, credenciales + Google OAuth.                 |
| **Estilos & UI**           | Tailwind CSS v4 + shadcn/ui (Radix)         | Componentes accesibles, diseño responsivo sin dependencias pesadas.                      |
| **Validaciones**           | Zod 4 + React Hook Form                     | Una sola fuente de verdad para schemas en cliente y servidor.                            |
| **Imágenes**               | Cloudinary                                  | Subida firmada directa desde el navegador y transformaciones en tiempo real.             |
| **Mapas & Geocoding**      | Leaflet + OpenStreetMap + Nominatim         | Mapa interactivo y geocodificación sin fricción de tarjeta de crédito ($0 costo real).   |
| **IA (Multiproveedor)**    | Vercel AI SDK (Gemini / Groq / OpenRouter)  | Generación automática de descripciones con fallback en cascada desacoplado.              |
| **Cache Efímero & Limits** | Upstash Redis + Ratelimit                   | Rate limiting por IP/usuario para login, contacto e IA.                                  |
| **Emails**                 | Resend + React Email                        | Templates en componentes React con fallback de consola en dev.                           |
| **Testing**                | Vitest + React Testing Library + Playwright | Unitarios, integración con Postgres real y E2E de flujos críticos.                       |
| **Deploy & CI/CD**         | Vercel (Hobby) + GitHub Actions             | Deploy automático con preview deployments por PR y verificaciones en CI.                 |

---

## 🏛️ Arquitectura (Screaming Architecture + Capas Hexagonales)

Código organizado **por dominio de negocio** en `src/features/`, manteniendo una separación de capas estricta dentro de cada carpeta:

```
src/
├── app/                      # Rutas Next.js App Router (Solo composición, sin lógica de negocio)
│   ├── (public)/             # Grupo de rutas públicas (Home, Búsqueda, Detalle, Favoritos)
│   ├── (auth)/               # Grupo de autenticación (Login, Registro, Verificación, Reseteo)
│   ├── (vendedor)/           # Dashboard de vendedor (Crear/Editar publicaciones, ver mensajes)
│   ├── (admin)/              # Panel de administración y moderación
│   └── api/                  # Route Handlers (Auth, Webhooks, Crons)
├── proxy.ts                  # Middleware/Proxy en Next 16 (Chequeo optimista de sesión y cabeceras)
├── features/                 # Screaming Architecture: Un dominio por carpeta
│   ├── admin/                # Moderación de publicaciones y baneo de usuarios
│   ├── auth/                 # Registro, login, tokens de verificación, reseteo de password
│   ├── busqueda/             # Filtros combinados, full-text search GIN, relevancia
│   ├── contacto/             # Mensajería WhatsApp (wa.me), formulario y notificaciones por email
│   ├── favoritos/            # Guardar/quitar favoritos con toggle optimista
│   ├── ia/                   # Adaptadores de IA (Gemini, Groq, OpenRouter) y cascada de fallback
│   ├── publicaciones/        # Wizard de 4 pasos, CRUD, estados (borrador/activa/pausada/eliminada)
│   └── usuarios/             # Perfiles y gestión de datos de usuario
└── shared/                   # Código transversal reutilizado por 2+ features
    ├── components/ui/        # Primitivos visuales de shadcn/ui
    ├── lib/                  # Clientes de Prisma, Cloudinary, Upstash Redis, Auth.js
    ├── rutas.ts              # Constantes de rutas seguras
    ├── types/                # Tipos e interfaces compartidas
    └── utils/                # Funciones puras (formato de moneda, slugs, etc.)
```

### Reglas de Capas Enforzadas por ESLint

| Capa                | Ubicación                       | Regla de Oro                                                                   |
| :------------------ | :------------------------------ | :----------------------------------------------------------------------------- |
| **Presentación**    | `app/`, `features/*/components` | UI y formularios. **Prohibido** acceder a Prisma o contener reglas de negocio. |
| **Aplicación**      | `features/*/actions`            | Server Actions. Reciben input, validan con Zod y orquestan servicios.          |
| **Dominio**         | `features/*/services`           | Lógica pura. **Sin dependencias** de Prisma, HTTP ni APIs de Next.js.          |
| **Infraestructura** | `features/*/*Repository.ts`     | **Único lugar** donde se importa el cliente de Prisma.                         |

Estas reglas están configuradas mediante `no-restricted-imports` en [`eslint.config.mjs`](eslint.config.mjs), por lo que cualquier acoplamiento indebido **falla el build en CI**.

---

## ⚡ Puesta en Marcha Local

### 1. Instalación de Dependencias

```bash
npm install
```

### 2. Variables de Entorno

Copiá `.env.example` a `.env` y completá al menos **`DATABASE_URL`**, **`DATABASE_URL_UNPOOLED`** y **`AUTH_SECRET`** (`npx auth secret`).

```bash
DATABASE_URL="postgresql://user:password@ep-example.neon.tech/neondb?sslmode=require"
DATABASE_URL_UNPOOLED="postgresql://user:password@ep-example.neon.tech/neondb?sslmode=require"
AUTH_SECRET="tu_secreto_generado"
```

> **Nota:** Google OAuth, Resend y Upstash son opcionales en desarrollo local: sin ellos la app arranca igual y los links de verificación o reseteo se imprimen en la consola del servidor.

### 3. Base de Datos y Servidor de Dev

```bash
npm run db:generate
npm run db:migrate:deploy   # Si falla con P1001 por IPv6, usá: npm run db:migrate:http
npm run db:seed
npm run dev
```

La aplicación estará lista en `http://localhost:3000`.

---

## 🧪 Testing Suite (3 Niveles)

El proyecto cuenta con una cobertura completa dividida en tres niveles:

| Nivel           | Comando                    | Descripción                                                         |
| :-------------- | :------------------------- | :------------------------------------------------------------------ |
| **Unitarios**   | `npm test`                 | Tests puramente aislados en Vitest (jsdom/node en paralelo).        |
| **Integración** | `npm run test:integration` | Ejecuta actions y repositorios contra PostgreSQL real (vía Docker). |
| **E2E**         | `npm run test:e2e`         | Pruebas de navegación completa de punta a punta con Playwright.     |
| **Todos**       | `npm run test:all`         | Corre la suite completa en orden.                                   |

### Correr Tests con Base de Datos de Prueba (Docker)

```bash
# Levantar la base de datos de test en Docker
npm run test:db:up

# Correr todos los tests (Unitarios + Integración + E2E)
npm run test:all

# Apagar la base de datos de test
npm run test:db:down
```

---

## 📋 Comandos Disponibles

| Comando                    | Descripción                                              |
| :------------------------- | :------------------------------------------------------- |
| `npm run dev`              | Inicia el servidor de desarrollo                         |
| `npm run build`            | Realiza el build de producción                           |
| `npm run lint`             | Ejecuta ESLint (incluye reglas de arquitectura de capas) |
| `npm run type-check`       | Verificación de tipos TypeScript (`tsc --noEmit`)        |
| `npm test`                 | Vitest en modo ejecución para unit tests                 |
| `npm run test:coverage`    | Reporte de cobertura de tests unitarios                  |
| `npm run test:integration` | Pruebas de integración contra Postgres                   |
| `npm run test:e2e`         | Pruebas End-to-End con Playwright                        |
| `npm run format`           | Formatea el código con Prettier                          |
| `npm run db:seed`          | Carga el catálogo inicial de características/amenities   |
| `npm run db:studio`        | Abre Prisma Studio para inspeccionar la DB               |

---

## 🎯 Preguntas Frecuentes y Decisiones de Arquitectura (Sección 16)

Documentación de decisiones clave para entrevistas técnicas:

1. **¿Por qué Leaflet + OpenStreetMap en lugar de Google Maps?**  
   Para mantener un costo real de $0 sin requerir tarjeta de crédito en ningún punto del onboarding ni producción, permitiendo pines y clusters personalizados sin cuotas por SKU.
2. **¿Por qué monolito Next.js y no backend separado (Express/FastAPI)?**  
   Elimina fricción de CORS, despliega en un solo click en Vercel, comparte tipos TypeScript entre cliente y servidor, y mantiene cero costo de hosting adicional para un equipo de 3 personas.
3. **¿Cómo funciona la resiliencia de la IA?**  
   Se utiliza el patrón _Strategy/Adapter_ mediante Vercel AI SDK: intenta generar la descripción con **Gemini** (free tier generoso); si falla o agota cuota, cae automáticamente a **Groq** (baja latencia), y finalmente a **OpenRouter**. Si los 3 fallan, la publicación continúa permitiendo escritura manual (la IA nunca bloquea el camino crítico).
4. **¿Cómo se protegen los recursos del usuario (IDOR)?**  
   Todas las Server Actions re-verifican la autorización en el servidor comprobando que `publicacion.usuario_id === session.user.id` (o rol `admin`), ignorando cualquier ID o parámetro manipulado desde el cliente.
5. **¿Cómo se mitiga el spam y la fuerza bruta?**  
   Se implementó Rate Limiting con Upstash Redis por IP/Usuario en Server Actions de login (5 intentos/15 min), formulario de contacto (3 msgs/hora) e IA.

---

## 📄 Licencia y Créditos

Proyecto desarrollado como trabajo de portfolio profesional full-stack.  
Para consultar el Documento de Arquitectura Completo de 16 Secciones, revisar los archivos PDF adjuntos en el repositorio.
