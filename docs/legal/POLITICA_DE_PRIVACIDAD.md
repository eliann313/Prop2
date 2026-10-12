# Política de Privacidad y Tratamiento de Datos Personales — Prop²

**Última actualización:** 11 de octubre de 2026  
**Marco Legal:** Ley Nacional N° 25.326 de Protección de los Datos Personales de la República Argentina y su Decreto Reglamentario N° 1558/2001.

En **Prop²** (en adelante, la "Plataforma" o "nosotros") nos tomamos con absoluta seriedad la protección de los datos personales y el derecho a la intimidad de nuestros usuarios (en adelante, los "Titulares de los Datos" o "Usuarios"). La presente Política de Privacidad describe el modo en que recopilamos, tratamos, almacenamos, protegemos y compartimos sus datos personales, así como los derechos que le asisten bajo la legislación argentina vigente.

---

## 1. Identidad y Domicilio del Responsable del Tratamiento

- **Responsable:** Prop² (Plataforma Inmobiliaria)
- **Jurisdicción:** República Argentina
- **Contacto de Privacidad y Datos Personales:** `privacidad@prop2.com.ar`
- **Finalidad del registro de bases de datos:** Gestión de usuarios, publicación de avisos clasificados y facilitación del contacto entre partes interesadas en operaciones inmobiliarias.

---

## 2. Datos Personales que Recopilamos

### 2.1. Datos proporcionados directamente por el usuario

1. **Registro de cuenta:**
   - Nombre y apellido.
   - Dirección de correo electrónico.
   - Contraseña (almacenada de forma irreversible mediante algoritmo criptográfico robusto _bcrypt_ con factor de costo seguro).
   - Identificador y token seguro de sesión si utiliza autenticación federada (Google OAuth).
2. **Perfil y Gestión de Vendedor:**
   - Número de teléfono de contacto (utilizado para contacto directo o enlace a WhatsApp).
   - Matrícula profesional y Colegio al que pertenece (en caso de consignarse por corredores o martilleros matriculados).
3. **Formulario de Consulta / Contacto:**
   - Nombre del interesado.
   - Correo electrónico.
   - Número de teléfono.
   - Mensaje o consulta dirigida al anunciante del inmueble.
4. **Datos de Publicaciones:**
   - Dirección, localidad, provincia, coordenadas geográficas aproximadas del inmueble.
   - Fotografías y descripciones del inmueble.

### 2.2. Datos de Navegación y Técnicos Recopilados Automáticamente

- **Dirección IP:** Procesada temporalmente con fines de mitigación de ataques cibernéticos, prevención de fraudes y rate limiting (límite de intentos de autenticación y búsquedas). No se utiliza para geolocalización invasiva del individuo.
- **Analítica Web:** Utilizamos métricas de navegación respetuosas de la privacidad (_Vercel Web Analytics_), las cuales operan sin almacenar cookies de rastreo entre sitios (_cross-site tracking_), sin identificadores persistentes de usuario y sin recolectar datos sensibles.
- **Cookies de Sesión:** Únicamente cookies técnicas y estrictamente necesarias para el mantenimiento seguro de la sesión autenticada (Auth.js v5 con token JWT cifrado).

---

## 3. Finalidades del Tratamiento de los Datos

Los datos personales son tratados con las siguientes finalidades legítimas y no contrarias a la ley:

1. **Prestación y administración del servicio:** Permitir el registro de usuarios, la publicación y edición de inmuebles, la búsqueda con filtros avanzados y el guardado de favoritos.
2. **Conexión entre interesados y anunciantes:** Transmitir las consultas y datos de contacto del interesado al vendedor o locador del inmueble en cuestión.
3. **Seguridad y mitigación de abusos:** Detección y bloqueo de ataques de fuerza bruta, actividad de bots maliciosos, publicaciones fraudulentas y reseteo seguro de credenciales.
4. **Comunicaciones operativas del servicio:** Envío de correos de verificación de cuenta, confirmación de publicaciones y recuperación de contraseñas.
5. **Cumplimiento legal:** Cumplir con requerimientos de autoridades judiciales o administrativas competentes.

---

## 4. Principio de No Comercialización y Destinatarios de los Datos

**PROP² NO VENDE, NO ALQUILA, NO CEDE NI COMERCIALIZA LAS BASES DE DATOS DE SUS USUARIOS BAJO NINGÚN CONCEPTO.**

Los datos personales solo se comunican a los siguientes destinatarios bajo estrictos criterios de necesidad:

1. **Al Anunciante de la Propiedad:** Cuando un usuario envía un mensaje a través del formulario de contacto o interactúa con el botón de WhatsApp, los datos de contacto y el mensaje remitido son puestos a disposición exclusiva del publicante del aviso para responder la inquietud.
2. **Proveedores de Infraestructura Tecnológica (Encargados de Tratamiento):**
   - **Alojamiento y Base de Datos:** Neon Database (PostgreSQL serverless) bajo protocolos de encriptación TLS en tránsito y en reposo.
   - **Caché y Seguridad en Red:** Upstash Redis (gestión de límites de tasa y prevención de spam).
   - **Almacenamiento Multimedia:** Cloudinary (almacenamiento y optimización de imágenes de los avisos).
   - **Envío de Correos Electrónicos:** Resend / Servidores SMTP dedicados (exclusivamente para emails transaccionales del sistema).
   - **Modelos de Inteligencia Artificial:** Vercel AI SDK conectando con Google, Groq y OpenRouter. **Nota importante:** Los proveedores de IA procesan únicamente las características y comodidades del inmueble que el vendedor decide enviar para redactar la descripción. **En ningún caso se transfieren datos personales de compradores, mensajes de consulta ni bases de datos de usuarios a los modelos de IA.**
3. **Requerimiento Judicial o Administrativo:** Cuando medie orden judicial o disposición formal de autoridad pública competente en el marco de sus atribuciones legales.

---

## 5. Medidas de Seguridad de la Información

De conformidad con el artículo 9 de la Ley N° 25.326 y disposiciones de la Dirección Nacional de Protección de Datos Personales, Prop² implementa medidas técnicas y organizativas para garantizar la seguridad y confidencialidad de los datos y evitar su adulteración, pérdida, consulta o tratamiento no autorizado:

- Cifrado en tránsito mediante protocolo HTTPS / TLS 1.3.
- Hashing criptográfico irreversible de contraseñas mediante _bcrypt_.
- Cabeceras de seguridad estrictas: Content Security Policy (CSP) con _nonces_ criptográficos por petición, mitigando ataques XSS.
- Verificación contra filtraciones públicas de contraseñas conocidas (Have I Been Pwned API).
- Políticas de acceso restringido a las bases de datos de producción mediante variables de entorno protegidas.

---

## 6. Plazo de Conservación de los Datos

Los datos personales se conservarán durante el tiempo necesario para cumplir con las finalidades descritas en esta política, mientras el usuario mantenga su cuenta activa o hasta tanto solicite la supresión de sus datos, salvo obligación legal, impositiva o judicial de conservación por un período superior.

---

## 7. Ejercicio de los Derechos de Acceso, Rectificación, Actualización y Supresión (Derechos ARCO)

De conformidad con los artículos 14, 15 y 16 de la Ley N° 25.326, usted tiene derecho en cualquier momento a:

1. **Acceder** a sus datos personales almacenados en nuestras bases de datos de forma gratuita.
2. **Rectificar o Actualizar** datos incompletos, inexactos o desactualizados.
3. **Solicitar la Supresión** de sus datos cuando hayan dejado de ser necesarios o cuando revoque el consentimiento otorgado.

### Procedimiento para ejercer sus derechos:

Para ejercer cualquiera de estos derechos, el titular deberá enviar un correo electrónico a:  
📧 **`privacidad@prop2.com.ar`**  
con el asunto _"Protección de Datos Personales — Ejercicio de Derechos"_, adjuntando:

- Nombre y apellido completos.
- Correo electrónico registrado en la Plataforma.
- Copia digital de su Documento Nacional de Identidad (DNI) o documento acreditativo equivalente para verificar fehacientemente su identidad.
- Descripción clara del derecho que desea ejercer y de los datos objeto de la solicitud.

**Plazos legales de respuesta:**

- Solicitudes de información y acceso: máximo de diez (10) días corridos desde la recepción de la solicitud fehaciente.
- Solicitudes de rectificación, actualización o supresión: máximo de cinco (5) días hábiles desde la recepción de la solicitud.

---

## 8. Leyenda Reglamentaria Obligatoria de la AAIP

En cumplimiento de la **Resolución N° 14/2018 de la Agencia de Acceso a la Información Pública (AAIP)**:

> **"El titular de los datos personales tiene la facultad de ejercer el derecho de acceso a los mismos en forma gratuita a intervalos no inferiores a seis meses, salvo que se acredite un interés legítimo al efecto conforme lo establecido en el artículo 14, inciso 3 de la Ley Nº 25.326."**

> **"La AGENCIA DE ACCESO A LA INFORMACIÓN PÚBLICA, Órgano de Control de la Ley Nº 25.326, tiene la atribución de atender las denuncias y reclamos que se interpongan con relación al incumplimiento de las normas sobre protección de datos personales."**

- Dirección: Av. Pte. Gral. Julio A. Roca 710, Piso 3°, Ciudad Autónoma de Buenos Aires.
- Sitio web oficial de denuncias: [www.argentina.gob.ar/aaip/datospersonales](https://www.argentina.gob.ar/aaip/datospersonales)

---

## 9. Menores de Edad

La Plataforma no está dirigida ni orientada a menores de 18 años. No recopilamos a sabiendas datos de menores. Si un padre o tutor toma conocimiento de que su hijo menor de edad nos ha suministrado datos personales sin autorización, podrá solicitar su inmediata supresión a través de nuestro correo de privacidad.

---

## 10. Modificaciones a la Presente Política

Prop² se reserva el derecho de actualizar o modificar esta Política de Privacidad para adecuarla a novedades legislativas, jurisprudenciales o técnicas. Cualquier cambio será publicado en esta misma sección, indicando la fecha de última modificación.
