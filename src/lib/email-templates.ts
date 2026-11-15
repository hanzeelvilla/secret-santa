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
  button?: { label: string; url: string };
  footer?: string;
};

/** Estructura común de todos los correos: devuelve HTML y texto plano. */
function render({ preheader, title, paragraphs, button, footer }: Layout) {
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
