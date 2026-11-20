import * as z from "zod";

export type FormState =
  | {
      error?: string;
      /** Mensaje de confirmación tras guardar (p. ej. al editar el perfil). */
      success?: string;
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

const personName = z
  .string()
  .trim()
  .min(2, "Tu nombre debe tener al menos 2 letras")
  .max(60, "Máximo 60 caracteres");

const newPassword = z
  .string()
  .min(8, "La contraseña debe tener al menos 8 caracteres")
  .max(100, "Máximo 100 caracteres");

export const registerSchema = z.object({
  name: personName,
  email,
  password: newPassword,
});

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Escribe tu contraseña"),
});

export const profileSchema = z.object({ name: personName });

export const forgotPasswordSchema = z.object({ email });

export const resetPasswordSchema = z
  .object({
    password: newPassword,
    confirmPassword: z.string().min(1, "Confirma tu nueva contraseña"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Las contraseñas no coinciden",
  });

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Escribe tu contraseña actual"),
    newPassword,
    confirmPassword: z.string().min(1, "Confirma tu nueva contraseña"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Las contraseñas no coinciden",
  })
  .refine((data) => data.newPassword !== data.currentPassword, {
    path: ["newPassword"],
    message: "La nueva contraseña debe ser distinta de la actual",
  });

export type ChangePasswordInput = z.input<typeof changePasswordSchema>;
export type ResetPasswordInput = z.input<typeof resetPasswordSchema>;
export type ForgotPasswordInput = z.input<typeof forgotPasswordSchema>;

export type ProfileInput = z.input<typeof profileSchema>;
export type RegisterInput = z.input<typeof registerSchema>;
export type LoginInput = z.input<typeof loginSchema>;

export const groupSchema = z
  .object({
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
    // "HH:mm" en 24 h; solo se acepta junto con una fecha.
    exchangeTime: z.preprocess(
      blankToUndefined,
      z
        .string()
        .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Escribe una hora válida")
        .optional(),
    ),
  })
  .refine((data) => !data.exchangeTime || !!data.exchangeDate, {
    path: ["exchangeTime"],
    message: "Elige primero la fecha",
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
