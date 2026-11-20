/** "2026-12-24" → "24 de diciembre de 2026" */
export function formatDate(isoDate: string): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("es-MX", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

/** "18:30" → "6:30 p. m." */
export function formatTime(time: string): string {
  const [h, min] = time.split(":").map(Number);
  const period = h >= 12 ? "p. m." : "a. m.";
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${String(min).padStart(2, "0")} ${period}`;
}

/** "2026-12-24", "18:30" → "24 de diciembre de 2026, 6:30 p. m." */
export function formatDateTime(isoDate: string, time?: string | null): string {
  return time
    ? `${formatDate(isoDate)}, ${formatTime(time)}`
    : formatDate(isoDate);
}

export function formatMoney(amount: number, currency: string): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}
