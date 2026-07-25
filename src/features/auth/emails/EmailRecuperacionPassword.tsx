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
  nombre: string;
  urlRestablecer: string;
};

export function EmailRecuperacionPassword({ nombre, urlRestablecer }: Props) {
  return (
    <Html lang="es">
      <Head />
      <Preview>Restablecé tu contraseña</Preview>
      <Body style={estilos.body}>
        <Container style={estilos.container}>
          <Heading style={estilos.heading}>Hola {nombre}</Heading>
          <Text style={estilos.text}>
            Pediste restablecer tu contraseña. Usá el botón de abajo para elegir una
            nueva.
          </Text>
          <Button style={estilos.button} href={urlRestablecer}>
            Elegir una nueva contraseña
          </Button>
          <Text style={estilos.footer}>
            El link vence en 1 hora y se puede usar una sola vez. Si no pediste esto, no
            hace falta que hagas nada: tu contraseña actual sigue siendo válida.
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
