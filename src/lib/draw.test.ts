import { describe, expect, it } from "vitest";
import { drawAssignments } from "./draw";

const ids = (n: number) => Array.from({ length: n }, (_, i) => `u${i}`);

describe("drawAssignments", () => {
  it.each([3, 4, 5, 10, 25, 50])("sorteo válido con %i participantes", (n) => {
    const people = ids(n);
    for (let round = 0; round < 50; round++) {
      const pairs = drawAssignments(people);

      // Todos dan y todos reciben exactamente una vez
      expect(pairs).toHaveLength(n);
      expect(new Set(pairs.map((p) => p.giverId))).toEqual(new Set(people));
      expect(new Set(pairs.map((p) => p.receiverId))).toEqual(new Set(people));

      // Nadie se regala a sí mismo
      expect(pairs.every((p) => p.giverId !== p.receiverId)).toBe(true);

      // Un solo ciclo: siguiendo la cadena se visita a todos antes de volver
      const next = new Map(pairs.map((p) => [p.giverId, p.receiverId]));
      let current = people[0];
      let steps = 0;
      do {
        current = next.get(current)!;
        steps++;
      } while (current !== people[0]);
      expect(steps).toBe(n);
    }
  });

  it("no siempre da el mismo resultado", () => {
    const people = ids(8);
    const results = new Set(
      Array.from({ length: 20 }, () => JSON.stringify(drawAssignments(people))),
    );
    expect(results.size).toBeGreaterThan(1);
  });

  it("rechaza menos de 3 participantes", () => {
    expect(() => drawAssignments(ids(2))).toThrow();
    expect(() => drawAssignments([])).toThrow();
  });

  it("rechaza participantes repetidos", () => {
    expect(() => drawAssignments(["a", "b", "a"])).toThrow();
  });

  it("no modifica la lista original", () => {
    const people = ids(6);
    const copy = [...people];
    drawAssignments(people);
    expect(people).toEqual(copy);
  });
});
