import * as z from "zod";

export type FormState =
  | {
      error?: string;
      fieldErrors?: Record<string, string[] | undefined>;
    }
  | undefined;

export const CURRENCIES = ["MXN", "USD", "EUR"] as const;

const blankToUndefined = (value: unknown) =>
  value === null || (typeof value === "string" && value.trim() === "")
    ? undefined
    : value;

const email = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email("Escribe un correo válido"));

export const registerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Tu nombre debe tener al menos 2 letras")
    .max(60, "Máximo 60 caracteres"),
  email,
  password: z
    .string()
    .min(8, "La contraseña debe tener al menos 8 caracteres")
    .max(100, "Máximo 100 caracteres"),
});

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Escribe tu contraseña"),
});

export const groupSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "El nombre debe tener al menos 2 letras")
    .max(60, "Máximo 60 caracteres"),
  description: z.preprocess(
    blankToUndefined,
    z.string().trim().max(300, "Máximo 300 caracteres").optional(),
  ),
  budget: z.preprocess(
    blankToUndefined,
    z.coerce
      .number("Escribe un monto válido")
      .int("Usa un monto sin decimales")
      .positive("El monto debe ser mayor a 0")
      .max(1_000_000, "Ese monto es demasiado alto")
      .optional(),
  ),
  currency: z.enum(CURRENCIES).default("MXN"),
  exchangeDate: z.preprocess(
    blankToUndefined,
    z.iso.date("Escribe una fecha válida").optional(),
  ),
});

export const itemSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Escribe qué te gustaría recibir")
    .max(100, "Máximo 100 caracteres"),
  url: z.preprocess(
    blankToUndefined,
    z
      .url({
        protocol: /^https?$/,
        error: "El enlace debe empezar con http:// o https://",
      })
      .max(500, "El enlace es demasiado largo")
      .optional(),
  ),
  note: z.preprocess(
    blankToUndefined,
    z.string().trim().max(200, "Máximo 200 caracteres").optional(),
  ),
});

export function toFormState(error: z.ZodError): FormState {
  return { fieldErrors: z.flattenError(error).fieldErrors };
}
