import { randomInt } from "node:crypto";

export type Pair = { giverId: string; receiverId: string };

export const MIN_PARTICIPANTS = 3;

/**
 * Sorteo de Secret Santa.
 *
 * Baraja a los participantes (Fisher–Yates) y los asigna en un solo ciclo:
 * cada quien le regala al siguiente y el último al primero. Así nadie se
 * regala a sí mismo, todos dan y reciben exactamente un regalo, y no se
 * forman parejas o subgrupos cerrados.
 *
 * `rand(n)` debe devolver un entero uniforme en [0, n).
 */
export function drawAssignments(
  participantIds: string[],
  rand: (maxExclusive: number) => number = randomInt,
): Pair[] {
  if (new Set(participantIds).size !== participantIds.length) {
    throw new Error("Hay participantes repetidos");
  }
  if (participantIds.length < MIN_PARTICIPANTS) {
    throw new Error(`Se necesitan al menos ${MIN_PARTICIPANTS} participantes`);
  }

  const order = [...participantIds];
  for (let i = order.length - 1; i > 0; i--) {
    const j = rand(i + 1);
    [order[i], order[j]] = [order[j], order[i]];
  }

  return order.map((giverId, i) => ({
    giverId,
    receiverId: order[(i + 1) % order.length],
  }));
}
