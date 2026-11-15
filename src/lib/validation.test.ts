import { describe, expect, it } from "vitest";
import { profileSchema, registerSchema } from "./validation";

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
