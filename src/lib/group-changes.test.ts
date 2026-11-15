import { describe, expect, it } from "vitest";
import { diffGroup, type GroupSnapshot } from "./group-changes";

const base: GroupSnapshot = {
  name: "Posada",
  description: "Casa de Jandy",
  budget: 500,
  currency: "MXN",
  exchangeDate: "2026-12-24",
};

describe("diffGroup", () => {
  it("sin cambios devuelve una lista vacía", () => {
    expect(diffGroup(base, { ...base })).toEqual([]);
  });

  it("ignora espacios sobrantes en nombre y descripción", () => {
    expect(
      diffGroup(base, { ...base, name: "  Posada ", description: " Casa de Jandy  " }),
    ).toEqual([]);
  });

  it("detecta el cambio de nombre", () => {
    expect(diffGroup(base, { ...base, name: "Posada 2026" })).toEqual([
      { label: "Nombre", from: "Posada", to: "Posada 2026" },
    ]);
  });

  it("detecta una descripción nueva, cambiada o borrada", () => {
    const added = diffGroup({ ...base, description: null }, base);
    expect(added).toEqual([
      { label: "Descripción", from: "Sin descripción", to: "Casa de Jandy" },
    ]);
    const removed = diffGroup(base, { ...base, description: "  " });
    expect(removed[0]).toMatchObject({ label: "Descripción", to: "Sin descripción" });
  });

  it("trata null y vacío como lo mismo en la descripción", () => {
    expect(diffGroup({ ...base, description: null }, { ...base, description: "" })).toEqual([]);
  });

  it("recorta descripciones muy largas", () => {
    const [change] = diffGroup(base, { ...base, description: "a".repeat(500) });
    expect(change.to.length).toBeLessThanOrEqual(160);
    expect(change.to.endsWith("…")).toBe(true);
  });

  it("detecta presupuesto nuevo, quitado o en otra moneda", () => {
    const added = diffGroup({ ...base, budget: null }, base);
    expect(added[0]).toMatchObject({ label: "Presupuesto", from: "Sin presupuesto" });
    const removed = diffGroup(base, { ...base, budget: null });
    expect(removed[0]).toMatchObject({ label: "Presupuesto", to: "Sin presupuesto" });
    const currency = diffGroup(base, { ...base, currency: "USD" });
    expect(currency).toHaveLength(1);
    expect(currency[0].label).toBe("Presupuesto");
  });

  it("detecta fecha añadida, cambiada o quitada", () => {
    const removed = diffGroup(base, { ...base, exchangeDate: null });
    expect(removed[0]).toMatchObject({ label: "Fecha del intercambio", to: "Sin fecha" });
    const added = diffGroup({ ...base, exchangeDate: null }, base);
    expect(added[0]).toMatchObject({ from: "Sin fecha" });
    expect(diffGroup(base, { ...base, exchangeDate: "2026-12-31" })).toHaveLength(1);
  });

  it("junta varios cambios en el orden de la pantalla", () => {
    const changes = diffGroup(base, {
      name: "Otra",
      description: null,
      budget: 800,
      currency: "MXN",
      exchangeDate: null,
    });
    expect(changes.map((c) => c.label)).toEqual([
      "Nombre",
      "Descripción",
      "Presupuesto",
      "Fecha del intercambio",
    ]);
  });
});
