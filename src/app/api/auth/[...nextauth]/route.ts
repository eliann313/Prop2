import { handlers } from "@/features/auth/authJsInstance";

// Único endpoint que expone Auth.js (callbacks de OAuth, signin/signout, sesión).
// Es un Route Handler y no una Server Action porque Google necesita una URL concreta a la que
// redirigir al volver de la pantalla de consentimiento (5.1).
export const { GET, POST } = handlers;
