import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Une clases de Tailwind resolviendo conflictos (la última gana). Es el helper que esperan
 * los componentes de shadcn/ui; el alias `utils` de components.json apunta acá.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
