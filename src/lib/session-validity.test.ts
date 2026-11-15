import { describe, expect, it } from "vitest";
import { isSessionStale } from "./session-validity";

const changedAt = new Date("2026-11-15T12:00:00.700Z");
const changedSeconds = Math.floor(changedAt.getTime() / 1000);

describe("isSessionStale", () => {
  it("sin cambio de contraseña previo, la sesión es válida", () => {
    expect(isSessionStale(changedSeconds - 1000, null)).toBe(false);
  });

  it("una sesión anterior al cambio ya no vale", () => {
    expect(isSessionStale(changedSeconds - 1, changedAt)).toBe(true);
    expect(isSessionStale(changedSeconds - 3600, changedAt)).toBe(true);
  });

  it("la sesión reemitida en el mismo segundo del cambio sigue valiendo", () => {
    expect(isSessionStale(changedSeconds, changedAt)).toBe(false);
  });

  it("una sesión posterior al cambio es válida", () => {
    expect(isSessionStale(changedSeconds + 1, changedAt)).toBe(false);
  });

  it("sin fecha de emisión y con cambio previo, se considera vencida", () => {
    expect(isSessionStale(undefined, changedAt)).toBe(true);
    expect(isSessionStale(undefined, null)).toBe(false);
  });
});
