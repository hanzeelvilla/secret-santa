// Plantillas de correo. Los clientes de correo no soportan CSS externo ni
// variables, así que los estilos van en línea con los colores de la app.

const COLORS = {
  night: "#06140f",
  berry: "#c21f30",
  cream: "#fdf6e7",
  ink: "#2b1a14",
};

const SERIF = "Georgia, 'Times New Roman', serif";
const SANS = "Arial, Helvetica, sans-serif";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

type Layout = {
  /** Texto corto que algunos clientes muestran junto al asunto. */
  preheader: string;
  title: string;
  /** Párrafos como HTML (escapa tú los datos del usuario con `escapeHtml`). */
  paragraphs: string[];
  /** Bloque opcional tras los párrafos (p. ej. una lista de cambios). */
  details?: { html: string; text: string[] };
  button?: { label: string; url: string };
  footer?: string;
};

/** Estructura común de todos los correos: devuelve HTML y texto plano. */
function render({
  preheader,
  title,
  paragraphs,
  details,
  button,
  footer,
}: Layout) {
  const body = paragraphs
    .map((p) => `<p style="margin:0 0 14px;font-size:15px;line-height:1.5;">${p}</p>`)
    .join("");

  const buttonHtml = button
    ? `<p style="margin:22px 0;text-align:center;"><a href="${escapeHtml(button.url)}" style="display:inline-block;background:${COLORS.berry};color:#ffffff;text-decoration:none;font-weight:bold;font-size:15px;padding:12px 28px;border-radius:999px;">${escapeHtml(button.label)}</a></p>` +
      `<p style="margin:0 0 14px;font-size:12px;line-height:1.5;color:#6b5a52;">Si el botón no funciona, copia y pega este enlace en tu navegador:<br><a href="${escapeHtml(button.url)}" style="color:${COLORS.berry};word-break:break-all;">${escapeHtml(button.url)}</a></p>`
    : "";

  const footerHtml = footer
    ? `<p style="margin:0;font-size:12px;line-height:1.5;color:#6b5a52;">${footer}</p>`
    : "";

  const html = `<!doctype html>
<html lang="es">
  <body style="margin:0;padding:0;background:${COLORS.night};">
    <span style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(preheader)}</span>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${COLORS.night};padding:24px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;">
            <tr>
              <td align="center" style="padding:0 0 12px;font-family:${SERIF};font-size:26px;font-weight:bold;color:${COLORS.cream};">
                🎅 Secret Santa
              </td>
            </tr>
            <tr>
              <td style="background:${COLORS.cream};border-radius:16px;padding:28px 24px;font-family:${SANS};color:${COLORS.ink};">
                <h1 style="margin:0 0 12px;font-family:${SERIF};font-size:28px;line-height:1.2;color:${COLORS.berry};">${escapeHtml(title)}</h1>
                ${body}
                ${details?.html ?? ""}
                ${buttonHtml}
                ${footerHtml}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  const stripTags = (value: string) => value.replace(/<[^>]+>/g, "");
  const text = [
    title,
    "",
    ...paragraphs.map(stripTags),
    ...(details ? ["", ...details.text] : []),
    ...(button ? ["", `${button.label}: ${button.url}`] : []),
    ...(footer ? ["", stripTags(footer)] : []),
  ].join("\n");

  return { html, text };
}

export function verificationEmail({ name, url }: { name: string; url: string }) {
  const { html, text } = render({
    preheader: "Confirma tu correo para empezar a usar Secret Santa",
    title: "Confirma tu correo 🎄",
    paragraphs: [
      `¡Hola, ${escapeHtml(name)}! Gracias por unirte a Secret Santa.`,
      "Para activar tu cuenta, confirma que este correo es tuyo. El enlace vale por 24 horas.",
    ],
    button: { label: "Confirmar mi correo", url },
    footer: "Si no creaste esta cuenta, puedes ignorar este correo.",
  });
  return { subject: "Confirma tu correo en Secret Santa 🎅", html, text };
}

export function passwordResetEmail({ name, url }: { name: string; url: string }) {
  const { html, text } = render({
    preheader: "Elige una contraseña nueva para tu cuenta de Secret Santa",
    title: "Restablece tu contraseña 🔑",
    paragraphs: [
      `¡Hola, ${escapeHtml(name)}! Recibimos una solicitud para restablecer la contraseña de tu cuenta.`,
      "Usa el botón para elegir una nueva. El enlace vale por 1 hora y solo se puede usar una vez.",
    ],
    button: { label: "Elegir nueva contraseña", url },
    footer:
      "Si no lo pediste, ignora este correo: tu contraseña no cambiará.",
  });
  return { subject: "Restablece tu contraseña de Secret Santa 🔑", html, text };
}

export function passwordChangedEmail({
  name,
  resetUrl,
}: {
  name: string;
  resetUrl: string;
}) {
  const { html, text } = render({
    preheader: "Tu contraseña de Secret Santa se cambió",
    title: "Tu contraseña cambió 🔒",
    paragraphs: [
      `¡Hola, ${escapeHtml(name)}! Te avisamos de que la contraseña de tu cuenta se acaba de cambiar y se cerraron tus otras sesiones.`,
      "Si fuiste tú, no tienes que hacer nada.",
    ],
    button: { label: "No fui yo: restablecer contraseña", url: resetUrl },
    footer:
      "Si no reconoces este cambio, restablece tu contraseña de inmediato desde el botón.",
  });
  return { subject: "Tu contraseña de Secret Santa cambió 🔒", html, text };
}

type GroupChange = { label: string; from: string; to: string };

export function groupUpdatedEmail({
  name,
  ownerName,
  groupName,
  changes,
  url,
}: {
  name: string;
  ownerName: string;
  groupName: string;
  changes: GroupChange[];
  url: string;
}) {
  const rows = changes
    .map(
      (change) =>
        `<li style="margin:0 0 10px;"><strong>${escapeHtml(change.label)}</strong><br>` +
        `<span style="color:#6b5a52;text-decoration:line-through;">${escapeHtml(change.from)}</span><br>` +
        `<span style="color:${COLORS.berry};font-weight:bold;">${escapeHtml(change.to)}</span></li>`,
    )
    .join("");

  const { html, text } = render({
    preheader: `${ownerName} actualizó «${groupName}»`,
    title: "El intercambio se actualizó ✏️",
    paragraphs: [
      `¡Hola, ${escapeHtml(name)}! ${escapeHtml(ownerName)} hizo cambios en «${escapeHtml(groupName)}»:`,
    ],
    details: {
      html: `<ul style="margin:0 0 14px;padding-left:20px;font-size:15px;line-height:1.5;">${rows}</ul>`,
      text: changes.map((c) => `- ${c.label}: ${c.from} → ${c.to}`),
    },
    button: { label: "Ver el grupo", url },
    footer: "Recibes este correo porque participas en este intercambio.",
  });
  return { subject: `«${groupName}» se actualizó ✏️`, html, text };
}

export function drawDoneEmail({
  name,
  ownerName,
  groupName,
  redo,
  exchangeDate,
  budget,
  url,
}: {
  name: string;
  ownerName: string;
  groupName: string;
  redo: boolean;
  /** Ya formateados para mostrar (p. ej. "24 de diciembre de 2026"). */
  exchangeDate?: string | null;
  budget?: string | null;
  url: string;
}) {
  const facts = [
    exchangeDate ? `📅 Fecha del intercambio: ${exchangeDate}` : null,
    budget ? `💰 Presupuesto: ${budget}` : null,
  ].filter((fact): fact is string => fact !== null);

  const { html, text } = render({
    preheader: redo
      ? `${ownerName} rehizo el sorteo de «${groupName}»`
      : `Ya puedes descubrir a quién le regalas en «${groupName}»`,
    title: redo ? "Se rehízo el sorteo 🎲" : "¡Ya se hizo el sorteo! 🎁",
    paragraphs: [
      redo
        ? `¡Hola, ${escapeHtml(name)}! ${escapeHtml(ownerName)} rehízo el sorteo de «${escapeHtml(groupName)}». Tu asignación pudo cambiar: vuelve a abrir tu regalo para descubrir a quién le regalas.`
        : `¡Hola, ${escapeHtml(name)}! ${escapeHtml(ownerName)} acaba de hacer el sorteo de «${escapeHtml(groupName)}». Entra para abrir tu regalo y descubrir a quién le regalas.`,
      "Por seguridad, este correo no dice a quién le tocó a nadie: solo tú lo verás al abrir tu regalo en la app. 🤫",
    ],
    details: facts.length
      ? {
          html: `<p style="margin:0 0 14px;font-size:15px;line-height:1.6;">${facts.map(escapeHtml).join("<br>")}</p>`,
          text: facts,
        }
      : undefined,
    button: { label: "Descubrir mi regalo", url },
    footer: "Recibes este correo porque participas en este intercambio.",
  });
  return {
    subject: redo
      ? `Se rehízo el sorteo de «${groupName}» 🎲`
      : `¡Ya se hizo el sorteo de «${groupName}»! 🎁`,
    html,
    text,
  };
}
