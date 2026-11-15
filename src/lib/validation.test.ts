import { describe, expect, it } from "vitest";
import {
  changePasswordSchema,
  forgotPasswordSchema,
  profileSchema,
  registerSchema,
  resetPasswordSchema,
} from "./validation";

describe("profileSchema", () => {
  it("recorta los espacios del nombre", () => {
    const result = profileSchema.safeParse({ name: "  Ana María  " });
    expect(result.success && result.data.name).toBe("Ana María");
  });

  it("acepta acentos y la ñ", () => {
    expect(profileSchema.safeParse({ name: "Íñigo Núñez" }).success).toBe(true);
  });

  it("rechaza nombres de menos de 2 letras o solo espacios", () => {
    expect(profileSchema.safeParse({ name: "A" }).success).toBe(false);
    expect(profileSchema.safeParse({ name: "   " }).success).toBe(false);
    expect(profileSchema.safeParse({ name: "" }).success).toBe(false);
  });

  it("rechaza nombres de más de 60 caracteres", () => {
    expect(profileSchema.safeParse({ name: "a".repeat(61) }).success).toBe(false);
    expect(profileSchema.safeParse({ name: "a".repeat(60) }).success).toBe(true);
  });

  it("usa la misma regla que el registro", () => {
    const registro = registerSchema.safeParse({
      name: "A",
      email: "a@b.co",
      password: "12345678",
    });
    expect(registro.success).toBe(false);
  });
});

describe("changePasswordSchema", () => {
  const valid = {
    currentPassword: "vieja-clave",
    newPassword: "nueva-clave-1",
    confirmPassword: "nueva-clave-1",
  };

  it("acepta un cambio válido", () => {
    expect(changePasswordSchema.safeParse(valid).success).toBe(true);
  });

  it("exige la contraseña actual", () => {
    const result = changePasswordSchema.safeParse({ ...valid, currentPassword: "" });
    expect(result.success).toBe(false);
  });

  it("rechaza una contraseña nueva de menos de 8 caracteres", () => {
    const result = changePasswordSchema.safeParse({
      ...valid,
      newPassword: "corta",
      confirmPassword: "corta",
    });
    expect(result.success).toBe(false);
  });

  it("marca el error de coincidencia en la confirmación", () => {
    const result = changePasswordSchema.safeParse({
      ...valid,
      confirmPassword: "otra-distinta",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path[0] === "confirmPassword")).toBe(true);
    }
  });

  it("rechaza que la nueva sea igual a la actual", () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: "misma-clave-1",
      newPassword: "misma-clave-1",
      confirmPassword: "misma-clave-1",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path[0] === "newPassword")).toBe(true);
    }
  });
});

describe("resetPasswordSchema", () => {
  it("acepta contraseñas iguales de 8 o más caracteres", () => {
    expect(
      resetPasswordSchema.safeParse({ password: "12345678", confirmPassword: "12345678" }).success,
    ).toBe(true);
  });

  it("rechaza contraseñas distintas o muy cortas", () => {
    expect(
      resetPasswordSchema.safeParse({ password: "12345678", confirmPassword: "87654321" }).success,
    ).toBe(false);
    expect(
      resetPasswordSchema.safeParse({ password: "1234567", confirmPassword: "1234567" }).success,
    ).toBe(false);
  });
});

describe("forgotPasswordSchema", () => {
  it("normaliza el correo y rechaza los inválidos", () => {
    const ok = forgotPasswordSchema.safeParse({ email: "  Ana@Correo.COM " });
    expect(ok.success && ok.data.email).toBe("ana@correo.com");
    expect(forgotPasswordSchema.safeParse({ email: "no-es-correo" }).success).toBe(false);
    expect(forgotPasswordSchema.safeParse({ email: "" }).success).toBe(false);
  });
});
