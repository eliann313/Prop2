"use client";

type Props = {
  error: Error & { digest?: string };
  unstable_retry: () => void;
};

/**
 * Último recurso: se muestra cuando falla el LAYOUT raíz, que es justo lo que `error.tsx` no
 * puede cubrir (un boundary no puede capturar un error del layout que lo contiene).
 *
 * Reemplaza al layout raíz por completo, así que tiene que traer sus propias etiquetas `html`
 * y `body`. Por lo mismo no puede usar los componentes de shadcn/ui ni las clases de Tailwind
 * con confianza: si lo que falló fue el layout, puede haber fallado también la carga de los
 * estilos. Va todo con estilos inline, sin depender de nada.
 */
export default function ErrorGlobal({ error, unstable_retry }: Props) {
  return (
    <html lang="es-AR">
      <body
        style={{
          fontFamily: "system-ui, sans-serif",
          display: "flex",
          minHeight: "100vh",
          alignItems: "center",
          justifyContent: "center",
          margin: 0,
          padding: "1rem",
        }}
      >
        <div style={{ maxWidth: "28rem", textAlign: "center" }}>
          <h1 style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>
            La aplicación no pudo cargarse
          </h1>
          <p style={{ color: "#525252", lineHeight: 1.5 }}>
            Estamos al tanto del problema. Probá recargar en unos minutos.
          </p>
          {error.digest ? (
            <p
              style={{
                color: "#737373",
                fontFamily: "monospace",
                fontSize: "0.75rem",
                marginTop: "1rem",
              }}
            >
              Referencia: {error.digest}
            </p>
          ) : null}
          <button
            onClick={() => unstable_retry()}
            style={{
              marginTop: "1.5rem",
              padding: "0.5rem 1rem",
              borderRadius: "0.375rem",
              border: "none",
              background: "#171717",
              color: "#fff",
              cursor: "pointer",
              fontSize: "0.875rem",
            }}
          >
            Reintentar
          </button>
        </div>
      </body>
    </html>
  );
}
