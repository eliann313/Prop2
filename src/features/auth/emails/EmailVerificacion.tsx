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

// Templates de email como componentes React (2.8). Se renderizan en el servidor y se mandan
// por Resend; el HTML de email necesita estilos inline y tablas, que es lo que resuelven
// estos componentes.

type Props = {
  nombre: string;
  urlVerificacion: string;
};

export function EmailVerificacion({ nombre, urlVerificacion }: Props) {
  return (
    <Html lang="es">
      <Head />
      <Preview>Confirmá tu email para activar tu cuenta</Preview>
      <Body style={estilos.body}>
        <Container style={estilos.container}>
          <Heading style={estilos.heading}>Hola {nombre}</Heading>
          <Text style={estilos.text}>
            Gracias por crear tu cuenta. Confirmá tu email para poder iniciar sesión y
            empezar a publicar o guardar inmuebles.
          </Text>
          <Button style={estilos.button} href={urlVerificacion}>
            Confirmar mi email
          </Button>
          <Text style={estilos.footer}>
            El link vence en 24 horas. Si no creaste esta cuenta, podés ignorar este
            mensaje.
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
