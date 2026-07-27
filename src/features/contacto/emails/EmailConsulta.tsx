import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
} from "@react-email/components";

type Props = {
  nombreVendedor: string;
  tituloPublicacion: string;
  nombreInteresado: string;
  emailInteresado: string;
  telefonoInteresado?: string;
  mensaje: string;
  urlPublicacion: string;
};

export function EmailConsulta({
  nombreVendedor,
  tituloPublicacion,
  nombreInteresado,
  emailInteresado,
  telefonoInteresado,
  mensaje,
  urlPublicacion,
}: Props) {
  return (
    <Html lang="es">
      <Head />
      <Preview>{`${nombreInteresado} consultó por ${tituloPublicacion}`}</Preview>
      <Body style={estilos.body}>
        <Container style={estilos.container}>
          <Heading style={estilos.heading}>Hola {nombreVendedor}</Heading>
          <Text style={estilos.text}>
            Recibiste una consulta por <strong>{tituloPublicacion}</strong>.
          </Text>

          {/* El mensaje va en su propio bloque y con whiteSpace pre-line: se respeta cómo lo
              escribió la persona, sin que se pegue todo en un párrafo. */}
          <Text style={estilos.mensaje}>{mensaje}</Text>

          <Text style={estilos.text}>
            <strong>{nombreInteresado}</strong>
            <br />
            {emailInteresado}
            {telefonoInteresado ? (
              <>
                <br />
                {telefonoInteresado}
              </>
            ) : null}
          </Text>

          <Button style={estilos.button} href={urlPublicacion}>
            Ver la publicación
          </Button>

          <Text style={estilos.footer}>
            Respondé directamente a {emailInteresado}: Prop² no intermedia la
            conversación.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const estilos = {
  body: { backgroundColor: "#f5f5f5", fontFamily: "Arial, sans-serif" },
  container: {
    backgroundColor: "#ffffff",
    borderRadius: "8px",
    margin: "40px auto",
    padding: "32px",
    maxWidth: "480px",
  },
  heading: { fontSize: "20px", margin: "0 0 16px" },
  text: { fontSize: "15px", lineHeight: "24px", color: "#333333" },
  mensaje: {
    fontSize: "15px",
    lineHeight: "24px",
    color: "#171717",
    backgroundColor: "#fafafa",
    borderLeft: "3px solid #e5e5e5",
    padding: "12px 16px",
    whiteSpace: "pre-line" as const,
  },
  button: {
    backgroundColor: "#171717",
    borderRadius: "6px",
    color: "#ffffff",
    display: "inline-block",
    fontSize: "15px",
    padding: "12px 20px",
    textDecoration: "none",
    margin: "16px 0",
  },
  footer: { fontSize: "13px", color: "#737373", margin: "16px 0 0" },
} as const;
