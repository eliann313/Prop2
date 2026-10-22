-- CreateEnum
CREATE TYPE "estado_mensaje_contacto" AS ENUM ('nueva', 'leida', 'atendida');

-- AlterTable
ALTER TABLE "mensaje_contacto" ADD COLUMN     "estado" "estado_mensaje_contacto" NOT NULL DEFAULT 'nueva';

-- CreateIndex
CREATE INDEX "mensaje_contacto_publicacion_id_estado_created_at_idx" ON "mensaje_contacto"("publicacion_id", "estado", "created_at" DESC);
