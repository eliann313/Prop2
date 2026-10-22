import { z } from "zod";

export const ESTADOS_CONSULTA = ["nueva", "leida", "atendida"] as const;

export const ETIQUETAS_ESTADO_CONSULTA = {
  nueva: "Nueva",
  leida: "Leída",
  atendida: "Atendida",
} as const;

export const ETIQUETAS_ESTADO_CONSULTA_PLURAL = {
  nueva: "Nuevas",
  leida: "Leídas",
  atendida: "Atendidas",
} as const;

const schemaParametrosDeConsultas = z.object({
  pagina: z.coerce.number().int().min(1).max(500).catch(1),
  publicacionId: z.uuid().optional().catch(undefined),
  estado: z.enum(ESTADOS_CONSULTA).optional().catch(undefined),
});

export type ParametrosDeConsultas = z.output<typeof schemaParametrosDeConsultas>;

/** Normaliza searchParams arbitrarios para la bandeja de consultas. */
export function parsearParametrosDeConsultas(
  searchParams: Record<string, string | string[] | undefined>,
): ParametrosDeConsultas {
  const planos = Object.fromEntries(
    Object.entries(searchParams).map(([clave, valor]) => [
      clave,
      Array.isArray(valor) ? valor[0] : valor,
    ]),
  );

  return schemaParametrosDeConsultas.parse(planos);
}
