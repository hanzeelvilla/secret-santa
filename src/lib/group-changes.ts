import { formatDate, formatMoney } from "./format";

export type GroupSnapshot = {
  name: string;
  description: string | null;
  budget: number | null;
  currency: string;
  exchangeDate: string | null;
};

export type GroupChange = { label: string; from: string; to: string };

const MAX_TEXT = 160;

const clip = (text: string) =>
  text.length > MAX_TEXT ? `${text.slice(0, MAX_TEXT - 1)}…` : text;

const describeDescription = (value: string | null) =>
  value && value.trim() ? clip(value.trim()) : "Sin descripción";

const describeBudget = (budget: number | null, currency: string) =>
  budget === null ? "Sin presupuesto" : formatMoney(budget, currency);

const describeDate = (value: string | null) =>
  value ? formatDate(value) : "Sin fecha";

/**
 * Qué cambió entre dos versiones de un grupo, ya redactado en español para el
 * correo. Una lista vacía significa que no cambió nada (y no hay que avisar).
 */
export function diffGroup(
  before: GroupSnapshot,
  after: GroupSnapshot,
): GroupChange[] {
  const changes: GroupChange[] = [];

  if (before.name.trim() !== after.name.trim()) {
    changes.push({ label: "Nombre", from: before.name, to: after.name });
  }

  const beforeDescription = before.description?.trim() ?? "";
  const afterDescription = after.description?.trim() ?? "";
  if (beforeDescription !== afterDescription) {
    changes.push({
      label: "Descripción",
      from: describeDescription(before.description),
      to: describeDescription(after.description),
    });
  }

  if (before.budget !== after.budget || before.currency !== after.currency) {
    changes.push({
      label: "Presupuesto",
      from: describeBudget(before.budget, before.currency),
      to: describeBudget(after.budget, after.currency),
    });
  }

  if (before.exchangeDate !== after.exchangeDate) {
    changes.push({
      label: "Fecha del intercambio",
      from: describeDate(before.exchangeDate),
      to: describeDate(after.exchangeDate),
    });
  }

  return changes;
}
