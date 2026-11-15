import "server-only";
import { Resend } from "resend";

export type EmailMessage = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

/** URL pública de la app, para construir los enlaces de los correos. */
export function getAppUrl(): string {
  const configured = process.env.APP_URL?.replace(/\/+$/, "");
  if (configured) return configured;
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  return "http://localhost:3000";
}

/**
 * Envía un correo con Resend. En desarrollo, si faltan RESEND_API_KEY o
 * EMAIL_FROM, imprime el correo en la consola del servidor en lugar de fallar
 * (así se puede probar el flujo sin enviar nada de verdad).
 */
export async function sendEmail(message: EmailMessage): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;

  if (!apiKey || !from) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("Faltan RESEND_API_KEY o EMAIL_FROM para enviar correos");
    }
    console.log(
      `\n📧 [correo no enviado: falta RESEND_API_KEY o EMAIL_FROM]\nPara: ${message.to}\nAsunto: ${message.subject}\n${message.text}\n`,
    );
    return;
  }

  const { error } = await new Resend(apiKey).emails.send({
    from,
    to: message.to,
    subject: message.subject,
    html: message.html,
    text: message.text,
  });
  if (error) throw new Error(`Resend: ${error.message}`);
}

/** La API de lotes de Resend admite hasta 100 correos por petición. */
const BATCH_SIZE = 100;

/**
 * Envía varios correos (uno por destinatario, para poder personalizarlos) con
 * la API de lotes de Resend. En desarrollo sin RESEND_API_KEY o EMAIL_FROM los
 * imprime en la consola, igual que `sendEmail`.
 */
export async function sendEmails(messages: EmailMessage[]): Promise<void> {
  if (messages.length === 0) return;

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;

  if (!apiKey || !from) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("Faltan RESEND_API_KEY o EMAIL_FROM para enviar correos");
    }
    for (const message of messages) {
      console.log(
        `
📧 [correo no enviado: falta RESEND_API_KEY o EMAIL_FROM]
Para: ${message.to}
Asunto: ${message.subject}
${message.text}
`,
      );
    }
    return;
  }

  const resend = new Resend(apiKey);
  for (let i = 0; i < messages.length; i += BATCH_SIZE) {
    const chunk = messages.slice(i, i + BATCH_SIZE);
    const { error } = await resend.batch.send(
      chunk.map((message) => ({
        from,
        to: message.to,
        subject: message.subject,
        html: message.html,
        text: message.text,
      })),
    );
    if (error) throw new Error(`Resend: ${error.message}`);
  }
}
