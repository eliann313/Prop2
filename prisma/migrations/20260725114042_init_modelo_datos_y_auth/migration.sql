-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "rol" AS ENUM ('comprador', 'vendedor', 'admin');

-- CreateEnum
CREATE TYPE "estado_usuario" AS ENUM ('activo', 'baneado');

-- CreateEnum
CREATE TYPE "tipo_token" AS ENUM ('verificacion_email', 'recuperacion_password');

-- CreateEnum
CREATE TYPE "tipo_inmueble" AS ENUM ('casa', 'departamento', 'ph', 'terreno', 'local', 'oficina', 'galpon', 'cochera', 'quinta', 'campo');

-- CreateEnum
CREATE TYPE "operacion" AS ENUM ('venta', 'alquiler');

-- CreateEnum
CREATE TYPE "moneda" AS ENUM ('ARS', 'USD');

-- CreateEnum
CREATE TYPE "orientacion" AS ENUM ('norte', 'sur', 'este', 'oeste', 'noreste', 'noroeste', 'sureste', 'suroeste');

-- CreateEnum
CREATE TYPE "estado_publicacion" AS ENUM ('borrador', 'activa', 'pausada', 'eliminada');

-- CreateEnum
CREATE TYPE "estado_inmueble" AS ENUM ('a_estrenar', 'excelente', 'muy_bueno', 'bueno', 'a_refaccionar');

-- CreateEnum
CREATE TYPE "categoria_caracteristica" AS ENUM ('servicio', 'comodidad');

-- CreateEnum
CREATE TYPE "medio_contacto" AS ENUM ('whatsapp', 'formulario', 'email');

-- CreateTable
CREATE TABLE "usuario" (
    "id" UUID NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "email_verificado_en" TIMESTAMP(3),
    "avatar_url" TEXT,
    "password_hash" TEXT,
    "telefono" TEXT,
    "rol" "rol" NOT NULL DEFAULT 'comprador',
    "estado" "estado_usuario" NOT NULL DEFAULT 'activo',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cuenta_oauth" (
    "usuario_id" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "provider_account_id" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cuenta_oauth_pkey" PRIMARY KEY ("provider","provider_account_id")
);

-- CreateTable
CREATE TABLE "sesion" (
    "session_token" TEXT NOT NULL,
    "usuario_id" UUID NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sesion_pkey" PRIMARY KEY ("session_token")
);

-- CreateTable
CREATE TABLE "token_verificacion_authjs" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "token_verificacion_authjs_pkey" PRIMARY KEY ("identifier","token")
);

-- CreateTable
CREATE TABLE "token_verificacion" (
    "id" UUID NOT NULL,
    "usuario_id" UUID NOT NULL,
    "token_hash" TEXT NOT NULL,
    "tipo" "tipo_token" NOT NULL,
    "expira_en" TIMESTAMP(3) NOT NULL,
    "usado_en" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "token_verificacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "publicacion" (
    "id" UUID NOT NULL,
    "usuario_id" UUID NOT NULL,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "tipo_inmueble" "tipo_inmueble" NOT NULL,
    "operacion" "operacion" NOT NULL,
    "precio" DECIMAL(14,2) NOT NULL,
    "moneda" "moneda" NOT NULL,
    "provincia" TEXT NOT NULL,
    "ciudad" TEXT NOT NULL,
    "barrio" TEXT,
    "codigo_postal" TEXT,
    "direccion" TEXT,
    "latitud" DECIMAL(10,7) NOT NULL,
    "longitud" DECIMAL(10,7) NOT NULL,
    "superficie_cubierta" DECIMAL(10,2),
    "superficie_total" DECIMAL(10,2),
    "ambientes" INTEGER,
    "dormitorios" INTEGER,
    "banios" INTEGER,
    "piso" INTEGER,
    "orientacion" "orientacion",
    "tiene_cochera" BOOLEAN NOT NULL DEFAULT false,
    "antiguedad_anios" INTEGER,
    "expensas" DECIMAL(14,2),
    "video_url" TEXT,
    "estado_publicacion" "estado_publicacion" NOT NULL DEFAULT 'borrador',
    "estado_inmueble" "estado_inmueble",
    "vistas" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "published_at" TIMESTAMP(3),

    CONSTRAINT "publicacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "imagen_publicacion" (
    "id" UUID NOT NULL,
    "publicacion_id" UUID NOT NULL,
    "url" TEXT NOT NULL,
    "url_thumbnail" TEXT,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "es_portada" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "imagen_publicacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "caracteristica" (
    "id" UUID NOT NULL,
    "nombre" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "categoria" "categoria_caracteristica" NOT NULL,

    CONSTRAINT "caracteristica_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "publicacion_caracteristica" (
    "publicacion_id" UUID NOT NULL,
    "caracteristica_id" UUID NOT NULL,

    CONSTRAINT "publicacion_caracteristica_pkey" PRIMARY KEY ("publicacion_id","caracteristica_id")
);

-- CreateTable
CREATE TABLE "favorito" (
    "id" UUID NOT NULL,
    "usuario_id" UUID NOT NULL,
    "publicacion_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "favorito_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mensaje_contacto" (
    "id" UUID NOT NULL,
    "publicacion_id" UUID NOT NULL,
    "usuario_id" UUID,
    "nombre_contacto" TEXT NOT NULL,
    "email_contacto" TEXT NOT NULL,
    "telefono_contacto" TEXT,
    "mensaje" TEXT NOT NULL,
    "medio_contacto" "medio_contacto" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mensaje_contacto_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuario_email_key" ON "usuario"("email");

-- CreateIndex
CREATE INDEX "cuenta_oauth_usuario_id_idx" ON "cuenta_oauth"("usuario_id");

-- CreateIndex
CREATE INDEX "sesion_usuario_id_idx" ON "sesion"("usuario_id");

-- CreateIndex
CREATE UNIQUE INDEX "token_verificacion_authjs_token_key" ON "token_verificacion_authjs"("token");

-- CreateIndex
CREATE UNIQUE INDEX "token_verificacion_token_hash_key" ON "token_verificacion"("token_hash");

-- CreateIndex
CREATE INDEX "token_verificacion_usuario_id_tipo_idx" ON "token_verificacion"("usuario_id", "tipo");

-- CreateIndex
CREATE INDEX "publicacion_usuario_id_idx" ON "publicacion"("usuario_id");

-- CreateIndex
CREATE INDEX "publicacion_provincia_ciudad_idx" ON "publicacion"("provincia", "ciudad");

-- CreateIndex
CREATE INDEX "publicacion_tipo_inmueble_operacion_idx" ON "publicacion"("tipo_inmueble", "operacion");

-- CreateIndex
CREATE INDEX "publicacion_precio_idx" ON "publicacion"("precio");

-- CreateIndex
CREATE INDEX "publicacion_estado_publicacion_idx" ON "publicacion"("estado_publicacion");

-- CreateIndex
CREATE INDEX "publicacion_latitud_longitud_idx" ON "publicacion"("latitud", "longitud");

-- CreateIndex
CREATE INDEX "imagen_publicacion_publicacion_id_orden_idx" ON "imagen_publicacion"("publicacion_id", "orden");

-- CreateIndex
CREATE UNIQUE INDEX "caracteristica_nombre_key" ON "caracteristica"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "caracteristica_slug_key" ON "caracteristica"("slug");

-- CreateIndex
CREATE INDEX "publicacion_caracteristica_caracteristica_id_idx" ON "publicacion_caracteristica"("caracteristica_id");

-- CreateIndex
CREATE INDEX "favorito_publicacion_id_idx" ON "favorito"("publicacion_id");

-- CreateIndex
CREATE UNIQUE INDEX "favorito_usuario_id_publicacion_id_key" ON "favorito"("usuario_id", "publicacion_id");

-- CreateIndex
CREATE INDEX "mensaje_contacto_publicacion_id_idx" ON "mensaje_contacto"("publicacion_id");

-- CreateIndex
CREATE INDEX "mensaje_contacto_usuario_id_idx" ON "mensaje_contacto"("usuario_id");

-- AddForeignKey
ALTER TABLE "cuenta_oauth" ADD CONSTRAINT "cuenta_oauth_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sesion" ADD CONSTRAINT "sesion_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "token_verificacion" ADD CONSTRAINT "token_verificacion_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "publicacion" ADD CONSTRAINT "publicacion_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "imagen_publicacion" ADD CONSTRAINT "imagen_publicacion_publicacion_id_fkey" FOREIGN KEY ("publicacion_id") REFERENCES "publicacion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "publicacion_caracteristica" ADD CONSTRAINT "publicacion_caracteristica_publicacion_id_fkey" FOREIGN KEY ("publicacion_id") REFERENCES "publicacion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "publicacion_caracteristica" ADD CONSTRAINT "publicacion_caracteristica_caracteristica_id_fkey" FOREIGN KEY ("caracteristica_id") REFERENCES "caracteristica"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favorito" ADD CONSTRAINT "favorito_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favorito" ADD CONSTRAINT "favorito_publicacion_id_fkey" FOREIGN KEY ("publicacion_id") REFERENCES "publicacion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mensaje_contacto" ADD CONSTRAINT "mensaje_contacto_publicacion_id_fkey" FOREIGN KEY ("publicacion_id") REFERENCES "publicacion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mensaje_contacto" ADD CONSTRAINT "mensaje_contacto_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;
