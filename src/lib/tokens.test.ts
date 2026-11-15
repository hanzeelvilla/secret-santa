import { describe, expect, it } from "vitest";
import {
  cooldownSeconds,
  generateToken,
  hashToken,
  isExpired,
  MAX_SENDS_PER_HOUR,
  reachedHourlyLimit,
  RESEND_COOLDOWN_MS,
} from "./tokens";

describe("tokens", () => {
  it("el hash corresponde al token y no es el token", () => {
    const { token, hash } = generateToken();
    expect(hash).toBe(hashToken(token));
    expect(hash).not.toBe(token);
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it("genera tokens distintos y aptos para URLs", () => {
    const tokens = new Set(Array.from({ length: 200 }, () => generateToken().token));
    expect(tokens.size).toBe(200);
    for (const token of tokens) expect(token).toMatch(/^[A-Za-z0-9_-]{43}$/);
  });

  it("el hash cambia si cambia el token", () => {
    expect(hashToken("a")).not.toBe(hashToken("b"));
  });
});

describe("isExpired", () => {
  const now = new Date("2026-11-15T12:00:00Z");
  it("detecta vencidos y vigentes", () => {
    expect(isExpired(new Date("2026-11-15T11:59:59Z"), now)).toBe(true);
    expect(isExpired(new Date("2026-11-15T12:00:00Z"), now)).toBe(true);
    expect(isExpired(new Date("2026-11-15T12:00:01Z"), now)).toBe(false);
  });
});

describe("cooldownSeconds", () => {
  const now = new Date("2026-11-15T12:00:00Z");
  it("sin envíos previos no hay espera", () => {
    expect(cooldownSeconds(null, now)).toBe(0);
  });
  it("cuenta los segundos restantes, redondeando hacia arriba", () => {
    expect(cooldownSeconds(new Date(now.getTime() - 15_000), now)).toBe(45);
    expect(cooldownSeconds(new Date(now.getTime() - 59_500), now)).toBe(1);
  });
  it("pasado el tiempo de espera ya se puede reenviar", () => {
    expect(cooldownSeconds(new Date(now.getTime() - RESEND_COOLDOWN_MS), now)).toBe(0);
    expect(cooldownSeconds(new Date(now.getTime() - 5 * 60_000), now)).toBe(0);
  });
});

describe("reachedHourlyLimit", () => {
  it("bloquea al llegar al máximo por hora", () => {
    expect(reachedHourlyLimit(MAX_SENDS_PER_HOUR - 1)).toBe(false);
    expect(reachedHourlyLimit(MAX_SENDS_PER_HOUR)).toBe(true);
  });
});
