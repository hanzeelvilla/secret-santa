import type { Prisma } from "@prisma/client";

/** Grupos por página en "Mis grupos". */
export const PAGE_SIZE = 6;

/** Zona horaria con la que se decide qué es "hoy" (el servidor corre en UTC). */
export const APP_TIME_ZONE = "America/Mexico_City";

export const SORTS = ["recientes", "antiguos", "fecha", "nombre"] as const;
export const ROLES = ["todos", "organizo", "participo"] as const;
export const STATUSES = ["todos", "esperando", "sorteado"] as const;
export const WHENS = ["todas", "proximos", "pasados", "sin-fecha"] as const;

export type Sort = (typeof SORTS)[number];
export type Role = (typeof ROLES)[number];
export type Status = (typeof STATUSES)[number];
export type When = (typeof WHENS)[number];

export type GroupListParams = {
  q: string;
  sort: Sort;
  role: Role;
  status: Status;
  when: When;
  page: number;
};

export const DEFAULT_PARAMS: GroupListParams = {
  q: "",
  sort: "recientes",
  role: "todos",
  status: "todos",
  when: "todas",
  page: 1,
};

export const SORT_LABELS: Record<Sort, string> = {
  recientes: "Más recientes",
  antiguos: "Más antiguos",
  fecha: "Fecha del intercambio",
  nombre: "Nombre (A–Z)",
};
export const ROLE_LABELS: Record<Role, string> = {
  todos: "Todos",
  organizo: "Los que organizo",
  participo: "Los que participo",
};
export const STATUS_LABELS: Record<Status, string> = {
  todos: "Todos",
  esperando: "Esperando sorteo",
  sorteado: "Sorteo hecho",
};
export const WHEN_LABELS: Record<When, string> = {
  todas: "Todas",
  proximos: "Próximos",
  pasados: "Ya pasaron",
  "sin-fecha": "Sin fecha",
};

type RawParams = Record<string, string | string[] | undefined>;

const first = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

function pick<T extends string>(
  value: string | undefined,
  allowed: readonly T[],
  fallback: T,
): T {
  return allowed.find((option) => option === value) ?? fallback;
}

/** Lee los parámetros de la URL; lo desconocido o inválido cae al valor por defecto. */
export function parseGroupListParams(raw: RawParams): GroupListParams {
  const page = Number.parseInt(first(raw.pagina) ?? "", 10);
  return {
    q: (first(raw.q) ?? "").trim().slice(0, 60),
    sort: pick(first(raw.orden), SORTS, DEFAULT_PARAMS.sort),
    role: pick(first(raw.rol), ROLES, DEFAULT_PARAMS.role),
    status: pick(first(raw.estado), STATUSES, DEFAULT_PARAMS.status),
    when: pick(first(raw.fecha), WHENS, DEFAULT_PARAMS.when),
    page: Number.isFinite(page) && page >= 1 ? page : 1,
  };
}

/** Enlace a `/dashboard` con los parámetros dados (omite los que son el valor por defecto). */
export function groupListHref(params: Partial<GroupListParams>): string {
  const p = { ...DEFAULT_PARAMS, ...params };
  const search = new URLSearchParams();
  if (p.q) search.set("q", p.q);
  if (p.sort !== DEFAULT_PARAMS.sort) search.set("orden", p.sort);
  if (p.role !== DEFAULT_PARAMS.role) search.set("rol", p.role);
  if (p.status !== DEFAULT_PARAMS.status) search.set("estado", p.status);
  if (p.when !== DEFAULT_PARAMS.when) search.set("fecha", p.when);
  if (p.page > 1) search.set("pagina", String(p.page));
  const query = search.toString();
  return query ? `/dashboard?${query}` : "/dashboard";
}

/** ¿Hay algún filtro o búsqueda activos? (el orden y la página no cuentan) */
export function hasActiveFilters(params: GroupListParams): boolean {
  return (
    params.q !== "" ||
    params.role !== "todos" ||
    params.status !== "todos" ||
    params.when !== "todas"
  );
}

/** "AAAA-MM-DD" de hoy en la zona horaria de la app. */
export function todayIso(now: Date = new Date()): string {
  return now.toLocaleDateString("en-CA", { timeZone: APP_TIME_ZONE });
}

/** `where` y `orderBy` de Prisma (sobre `Membership`) para la lista del usuario. */
export function buildGroupListQuery(
  params: GroupListParams,
  userId: string,
  today: string,
): {
  where: Prisma.MembershipWhereInput;
  orderBy: Prisma.MembershipOrderByWithRelationInput[];
} {
  const group: Prisma.GroupWhereInput = {};

  if (params.q) group.name = { contains: params.q, mode: "insensitive" };
  if (params.role === "organizo") group.ownerId = userId;
  if (params.role === "participo") group.ownerId = { not: userId };
  if (params.status === "esperando") group.drawnAt = null;
  if (params.status === "sorteado") group.drawnAt = { not: null };
  if (params.when === "proximos") group.exchangeDate = { gte: today };
  if (params.when === "pasados") group.exchangeDate = { lt: today };
  if (params.when === "sin-fecha") group.exchangeDate = null;

  const byId: Prisma.MembershipOrderByWithRelationInput = { id: "asc" };
  const orderBy: Record<Sort, Prisma.MembershipOrderByWithRelationInput[]> = {
    recientes: [{ createdAt: "desc" }, byId],
    antiguos: [{ createdAt: "asc" }, byId],
    // Los grupos sin fecha siempre al final.
    fecha: [
      { group: { exchangeDate: { sort: "asc", nulls: "last" } } },
      { group: { exchangeTime: { sort: "asc", nulls: "last" } } },
      byId,
    ],
    nombre: [{ group: { name: "asc" } }, byId],
  };

  return {
    where: { userId, group },
    orderBy: orderBy[params.sort],
  };
}

/** Número de páginas (mínimo 1). */
export function pageCount(total: number): number {
  return Math.max(1, Math.ceil(total / PAGE_SIZE));
}

/** Páginas a mostrar: siempre la primera y la última, y las vecinas de la actual. */
export function pageWindow(current: number, total: number): (number | "…")[] {
  const pages = new Set<number>([1, total, current - 1, current, current + 1]);
  const sorted = [...pages]
    .filter((page) => page >= 1 && page <= total)
    .sort((a, b) => a - b);
  const result: (number | "…")[] = [];
  for (const page of sorted) {
    const previous = result[result.length - 1];
    if (typeof previous === "number" && page - previous > 1) result.push("…");
    result.push(page);
  }
  return result;
}
