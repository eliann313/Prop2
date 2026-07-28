import type { NextConfig } from "next";

/**
 * Cabeceras de seguridad de 8.12, salvo CSP.
 *
 * Van acá y no en el proxy, aunque 8.12 diga "middleware": el matcher del proxy excluye
 * `_next/static` y los archivos de imagen, que son justamente las respuestas donde
 * `nosniff` más importa — un asset servido con el Content-Type equivocado y reinterpretado
 * como HTML es el escenario que la cabecera evita. `headers()` de Next sí las aplica a
 * TODA respuesta, incluidos los assets.
 *
 * Son todas estáticas: no dependen de la request, así que no hay motivo para pagar una
 * ejecución de middleware por cada una.
 */
const CABECERAS_DE_SEGURIDAD = [
  {
    // Redundante con `frame-ancestors` de CSP para navegadores actuales, pero se deja por
    // los que todavía no la soportan: el costo es una cabecera de 24 bytes.
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    // La plataforma no pide ninguno de estos permisos. Apagarlos explícitamente achica la
    // superficie si un script inyectado intentara abusarlos.
    key: "Permissions-Policy",
    value: "geolocation=(), camera=(), microphone=()",
  },
  {
    // Dos años, que es el mínimo que pide la preload list de Chrome. Vercel ya fuerza HTTPS;
    // esto hace que el navegador ni siquiera intente el primer HTTP tras la visita inicial.
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains",
  },
];

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: "/:path*", headers: CABECERAS_DE_SEGURIDAD }];
  },
  images: {
    // `remotePatterns` y no el viejo `domains` (deprecado en Next 16): permite acotar también
    // el pathname, así el optimizador de imágenes solo procesa lo que sale de NUESTRA cuenta
    // de Cloudinary y no cualquier archivo alojado en res.cloudinary.com.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: `/${process.env.CLOUDINARY_CLOUD_NAME}/**`,
      },
    ],
  },
};

export default nextConfig;
