import { describe, expect, it } from "vitest";
import { formatDateTime, formatTime } from "./format";
import { groupSchema } from "./validation";

describe("formatTime", () => {
  it("muestra 12 horas con a. m. / p. m.", () => {
    expect(formatTime("18:30")).toBe("6:30 p. m.");
    expect(formatTime("09:05")).toBe("9:05 a. m.");
  });

  it("maneja medianoche y mediodía", () => {
    expect(formatTime("00:00")).toBe("12:00 a. m.");
    expect(formatTime("12:15")).toBe("12:15 p. m.");
  });
});

describe("formatDateTime", () => {
  it("junta fecha y hora", () => {
    expect(formatDateTime("2026-12-24", "18:30")).toBe(
      "24 de diciembre de 2026, 6:30 p. m.",
    );
  });

  it("sin hora muestra solo la fecha", () => {
    expect(formatDateTime("2026-12-24")).toBe("24 de diciembre de 2026");
    expect(formatDateTime("2026-12-24", null)).toBe("24 de diciembre de 2026");
  });
});

describe("groupSchema (hora)", () => {
  const base = { name: "Posada", currency: "MXN" };

  it("acepta fecha con hora", () => {
    const result = groupSchema.safeParse({
      ...base,
      exchangeDate: "2026-12-24",
      exchangeTime: "18:30",
    });
    expect(result.success).toBe(true);
  });

  it("rechaza una hora sin fecha", () => {
    const result = groupSchema.safeParse({ ...base, exchangeTime: "18:30" });
    expect(result.success).toBe(false);
  });

  it("rechaza horas con formato inválido", () => {
    for (const exchangeTime of ["25:00", "18:60", "6:30", "abc"]) {
      expect(
        groupSchema.safeParse({
          ...base,
          exchangeDate: "2026-12-24",
          exchangeTime,
        }).success,
      ).toBe(false);
    }
  });

  it("trata la hora vacía como no enviada", () => {
    const result = groupSchema.safeParse({
      ...base,
      exchangeDate: "2026-12-24",
      exchangeTime: "",
    });
    expect(result.success).toBe(true);
  });
});
