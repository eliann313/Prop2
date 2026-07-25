# ProyectoInmuebles

Plataforma de publicación, venta y alquiler de inmuebles en Argentina: los propietarios
publican directamente y los interesados contactan sin intermediarios.

Proyecto de portfolio. La documentación de arquitectura completa (16 secciones: alcance, stack,
modelo de datos, flujos, seguridad, SEO, roadmap por etapas, testing, DevOps) vive en Notion;
este README cubre solo cómo levantar y trabajar el repo.

**Estado: Etapas 0 y 1 completas** — infraestructura, modelo de datos y autenticación
end-to-end. El CRUD de publicaciones es Etapa 2 y la búsqueda Etapa 3.

## Stack

| Capa          | Elección                                        |
| ------------- | ----------------------------------------------- |
| Framework     | Next.js 16 (App Router) + React 19 + TypeScript |
| Base de datos | PostgreSQL en Neon                              |
| ORM           | Prisma 7 (driver adapter de Neon)               |
| Autenticación | Auth.js v5 — credenciales + Google OAuth        |
| UI            | Tailwind CSS v4 + shadcn/ui (sobre Radix)       |
| Validación    | Zod 4 + React Hook Form                         |
| Emails        | Resend + React Email                            |
| Rate limiting | Upstash Redis + Ratelimit                       |
| Tests         | Vitest + React Testing Library                  |
| Deploy        | Vercel (Hobby)                                  |

## Puesta en marcha

```bash
npm install
```

Copiá `.env.example` a `.env` y completá **`DATABASE_URL`**, **`DATABASE_URL_UNPOOLED`** y
**`AUTH_SECRET`** (`npx auth secret`). Google, Resend y Upstash son opcionales en desarrollo:
sin ellos la app arranca igual y los flujos de auth se pueden probar completos — los links de
verificación y de reseteo se imprimen en la consola del servidor en vez de enviarse por email.

```bash
npm run db:generate
npm run db:migrate:deploy   # si falla con P1001, usá: npm run db:migrate:http
npm run db:seed
npm run dev
```

> El `P1001` en una base que sí está accesible casi siempre es el problema de IPv6 descrito en
> [Migraciones](#migraciones). `db:migrate:http` aplica exactamente las mismas migraciones por
> otro transporte.

## Arquitectura

Monolito full-stack (un solo deploy) con el **código** organizado por dominio, no por capa
técnica — Screaming Architecture con disciplina hexagonal en los bordes.

```
src/
├── app/                      # Rutas. Solo composición, sin lógica de negocio.
│   ├── (public)/             # Route groups: agrupan por layout sin agregar segmento a la URL
│   ├── (auth)/               # login, registro, verificar-email, recuperar/restablecer
│   ├── (vendedor)/           # dashboard (requiere sesión)
│   ├── (admin)/              # admin (requiere rol admin)
│   └── api/auth/[...nextauth]/
├── proxy.ts                  # En Next 16 reemplaza a middleware.ts. Chequeo optimista de sesión.
├── features/                 # Un dominio por carpeta
│   ├── auth/
│   │   ├── actions/          # Server Actions: validan con Zod y orquestan
│   │   ├── services/         # Dominio puro: sin Prisma, sin HTTP, testeable aislado
│   │   ├── components/       # UI de la feature
│   │   ├── emails/           # Templates de React Email
│   │   └── *Repository.ts    # Único lugar que toca Prisma
│   └── usuarios/
└── shared/                   # Solo lo que usan 2+ features
    ├── components/ui/        # Primitivos de shadcn/ui
    ├── lib/                  # prismaClient, serverEnv, emailSender, rateLimiters, urlBase
    ├── rutas.ts              # Constantes de rutas (seguras de importar desde el cliente)
    ├── types/
    └── utils/
```

### Las capas, y por qué las hace cumplir ESLint

| Capa            | Vive en                         | Regla                                               |
| --------------- | ------------------------------- | --------------------------------------------------- |
| Presentación    | `app/`, `features/*/components` | No accede a Prisma ni contiene reglas de negocio    |
| Aplicación      | `features/*/actions`            | Único punto de entrada desde la UI hacia el backend |
| Dominio         | `features/*/services`           | No conoce Prisma, repositorios ni APIs de Next      |
| Infraestructura | `features/*/*Repository.ts`     | Único lugar donde se importa el cliente de Prisma   |

Estos límites están escritos como reglas de `no-restricted-imports` en
[`eslint.config.mjs`](eslint.config.mjs), así que romperlos **falla en CI** en vez de quedar
como un acuerdo que se erosiona con el tiempo. También está prohibido importar entre features
distintas: lo que dos features compartan se sube a `shared/`.

> Si editás esas reglas: `no-restricted-imports` es una sola clave, y un bloque posterior
> **reemplaza** lo que declararon los anteriores para los mismos archivos. No se acumulan. Por
> eso cada bloque repite todos los patrones que le corresponden.

## Comandos

| Comando                     | Qué hace                                        |
| --------------------------- | ----------------------------------------------- |
| `npm run dev`               | Servidor de desarrollo                          |
| `npm run build`             | Build de producción                             |
| `npm run lint`              | ESLint, incluidas las reglas de arquitectura    |
| `npm run type-check`        | `next typegen` + `tsc --noEmit`                 |
| `npm test`                  | Tests unitarios (Vitest)                        |
| `npm run test:coverage`     | Tests con reporte de cobertura                  |
| `npm run format`            | Prettier sobre todo el repo                     |
| `npm run db:generate`       | Genera el cliente de Prisma                     |
| `npm run db:migrate:deploy` | Aplica las migraciones pendientes               |
| `npm run db:seed`           | Carga el catálogo de características            |
| `npm run db:verify`         | Lista tablas, enums e índices reales de la base |
| `npm run db:studio`         | Prisma Studio                                   |

## Deploy en Vercel

Importá el repo desde el dashboard de Vercel; no hace falta tocar la configuración de build.

**Por qué hay un script `vercel-build` además de `build`:** el cliente de Prisma 7 se genera en
`src/generated/` y está gitignoreado (es código generado, no fuente), así que en un checkout
limpio no existe y `next build` solo falla con "Cannot find module". Vercel, si encuentra un
script `vercel-build`, lo usa en lugar de `build` — y ahí es donde corren las migraciones antes
del build, como pide 13.4. El `build` común no las corre, para que el CI pueda buildear con una
`DATABASE_URL` dummy sin intentar migrar nada.

Variables a cargar en Vercel (Settings → Environment Variables), separadas por entorno:

| Variable                | Production        | Preview              |
| ----------------------- | ----------------- | -------------------- |
| `DATABASE_URL`          | pooled            | pooled               |
| `DATABASE_URL_UNPOOLED` | directa           | directa              |
| `AUTH_SECRET`           | uno propio        | uno propio, distinto |
| `RESEND_API_KEY`        | key de producción | key de test          |
| `UPSTASH_*`             | sí                | sí                   |
| `AUTH_URL`              | **no cargar**     | **no cargar**        |

`AUTH_URL` se omite a propósito: Auth.js la deduce del deployment. Si se fija a mano, los links
de verificación de un preview deployment apuntarían a producción y el usuario terminaría
confirmando su email contra la base equivocada.

## Migraciones

El flujo normal es el de Prisma:

```bash
npx prisma migrate dev -n nombre_de_la_migracion
```

**Si `prisma migrate` falla con `P1001: Can't reach database server`** aunque la base esté
accesible: el motivo suele ser IPv6. El schema engine de Prisma resuelve el host de Neon,
prueba el registro AAAA primero, y en una red sin salida IPv6 real se queda esperando hasta el
timeout. Se confirma comparando el handshake de Postgres por IPv4 (responde) contra IPv6
(timeout). El runtime de la app no se ve afectado porque el driver adapter de Neon va por HTTPS.

En ese caso hay un camino alternativo que no toca el 5432:

```bash
npm run db:migrate:new -- nombre_de_la_migracion   # genera el SQL offline
npm run db:migrate:http                            # lo aplica por el driver HTTP de Neon
```

`db:migrate:new` diffea el schema actual contra `prisma/schema.snapshot.prisma` (el schema tal
como quedó en la última migración) y actualiza el snapshot. `db:migrate:http` hace lo mismo que
`prisma migrate deploy` —incluido el registro en `_prisma_migrations` con su checksum— pero
ejecutando el SQL por HTTPS. Los archivos de `prisma/migrations/` son idénticos a los que
generaría `migrate dev`, así que en Vercel y en CI (donde IPv6 funciona) se sigue usando
`prisma migrate deploy` sin nada especial.

## Cómo probar los flujos de auth sin configurar servicios externos

Con solo `DATABASE_URL` y `AUTH_SECRET`:

1. `npm run dev` y andá a `/registro`. Creá una cuenta.
2. El link de verificación **no** se envía por email: aparece en la consola del servidor.
   Abrilo.
3. Volvé a `/login`. Antes de verificar, el login se rechaza con el motivo puntual y ofrece
   reenviar el link; después de verificar, entra y redirige al dashboard.
4. `/recuperar-password` funciona igual: el link de reseteo sale por consola.

Los tokens se guardan **hasheados** (SHA-256) en la base, son de un solo uso, y emitir uno nuevo
invalida los anteriores del mismo tipo.

## Convenciones

- Nombres de archivo por rol, no genéricos: `authJsInstance.ts`, `usuarioRepository.ts`,
  `tokenVerificacionService.ts`. Nada de un `auth.ts` que después se multiplique en tres
  archivos homónimos con responsabilidades distintas.
- Componentes React en `PascalCase`; hooks `useAlgo`; Server Actions `verbo + entidad`
  (`registrarUsuario`); carpetas de features en plural.
- Componentes de servidor por default: `'use client'` es la excepción que hay que justificar.
- Los schemas de Zod son la única fuente de verdad de las validaciones — nunca se duplica una
  condición equivalente a mano en un componente.
- Los comentarios explican el **por qué**, no el qué.
- Conventional Commits. Git Flow simplificado: `main` + `develop` + `feature/*`.

## Deuda conocida

- **Un reseteo de contraseña no invalida las sesiones ya abiertas.** Con estrategia JWT la
  sesión no se consulta contra la base en cada request, así que un token emitido antes del
  cambio sigue siendo válido hasta que expira. Va junto con la rotación de JWT al cambiar de rol
  (Etapa 5).
- **Rate limiting inactivo sin Upstash.** El código degrada con gracia a propósito para el
  desarrollo local, pero es un requisito de release, no opcional en producción.
- **Sin índice full-text.** El índice GIN sobre `titulo` + `descripcion` necesita SQL crudo
  (`tsvector`) y se agrega en la Etapa 3, junto con las queries de búsqueda que lo justifican.
- **`legacy-peer-deps=true` en `.npmrc`.** Es un conflicto entre peers opcionales de
  `@hookform/resolvers` y `@typeschema/valibot` que no involucra ningún paquete que el proyecto
  importe. Se puede quitar cuando upstream lo resuelva.
- **Avisos de `npm audit`.** Los que quedan son transitivos de tooling de desarrollo (ReDoS en
  `minimatch`/`brace-expansion` vía ESLint, `postcss`/`sharp` vía Next). No hay camino desde
  una request de producción hasta ellos, y el `--force` degradaría Prisma a una versión anterior.
