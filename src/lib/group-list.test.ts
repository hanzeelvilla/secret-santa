import { describe, expect, it } from "vitest";
import {
  buildGroupListQuery,
  DEFAULT_PARAMS,
  groupListHref,
  hasActiveFilters,
  pageCount,
  pageWindow,
  parseGroupListParams,
  todayIso,
} from "./group-list";

describe("parseGroupListParams", () => {
  it("sin parámetros devuelve los valores por defecto", () => {
    expect(parseGroupListParams({})).toEqual(DEFAULT_PARAMS);
  });

  it("lee valores válidos", () => {
    expect(
      parseGroupListParams({
        q: "  posada ",
        orden: "fecha",
        rol: "organizo",
        estado: "sorteado",
        fecha: "proximos",
        pagina: "3",
      }),
    ).toEqual({
      q: "posada",
      sort: "fecha",
      role: "organizo",
      status: "sorteado",
      when: "proximos",
      page: 3,
    });
  });

  it("ignora valores desconocidos o inválidos", () => {
    const params = parseGroupListParams({
      orden: "xyz",
      rol: ["participo", "organizo"],
      estado: "",
      fecha: "mañana",
      pagina: "-2",
    });
    expect(params).toMatchObject({
      sort: "recientes",
      role: "participo", // si llega repetido, se usa el primero
      status: "todos",
      when: "todas",
      page: 1,
    });
    expect(parseGroupListParams({ pagina: "abc" }).page).toBe(1);
  });

  it("recorta búsquedas muy largas", () => {
    expect(parseGroupListParams({ q: "a".repeat(200) }).q).toHaveLength(60);
  });
});

describe("groupListHref", () => {
  it("omite los valores por defecto", () => {
    expect(groupListHref({})).toBe("/dashboard");
    expect(groupListHref({ page: 1 })).toBe("/dashboard");
  });

  it("incluye solo lo que cambió", () => {
    expect(
      groupListHref({ q: "casa", sort: "nombre", role: "organizo", page: 2 }),
    ).toBe("/dashboard?q=casa&orden=nombre&rol=organizo&pagina=2");
  });
});

describe("hasActiveFilters", () => {
  it("el orden y la página no cuentan como filtro", () => {
    expect(hasActiveFilters({ ...DEFAULT_PARAMS, sort: "nombre", page: 4 })).toBe(false);
    expect(hasActiveFilters({ ...DEFAULT_PARAMS, q: "a" })).toBe(true);
    expect(hasActiveFilters({ ...DEFAULT_PARAMS, when: "pasados" })).toBe(true);
  });
});

describe("buildGroupListQuery", () => {
  const build = (changes: Partial<typeof DEFAULT_PARAMS>) =>
    buildGroupListQuery({ ...DEFAULT_PARAMS, ...changes }, "u1", "2026-11-19");

  it("sin filtros solo limita al usuario y ordena por recientes", () => {
    const { where, orderBy } = build({});
    expect(where).toEqual({ userId: "u1", group: {} });
    expect(orderBy[0]).toEqual({ createdAt: "desc" });
  });

  it("busca por nombre sin distinguir mayúsculas", () => {
    expect(build({ q: "Posada" }).where.group).toEqual({
      name: { contains: "Posada", mode: "insensitive" },
    });
  });

  it("filtra por rol", () => {
    expect(build({ role: "organizo" }).where.group).toEqual({ ownerId: "u1" });
    expect(build({ role: "participo" }).where.group).toEqual({
      ownerId: { not: "u1" },
    });
  });

  it("filtra por estado del sorteo", () => {
    expect(build({ status: "esperando" }).where.group).toEqual({ drawnAt: null });
    expect(build({ status: "sorteado" }).where.group).toEqual({
      drawnAt: { not: null },
    });
  });

  it("filtra por fecha respecto a hoy", () => {
    expect(build({ when: "proximos" }).where.group).toEqual({
      exchangeDate: { gte: "2026-11-19" },
    });
    expect(build({ when: "pasados" }).where.group).toEqual({
      exchangeDate: { lt: "2026-11-19" },
    });
    expect(build({ when: "sin-fecha" }).where.group).toEqual({
      exchangeDate: null,
    });
  });

  it("combina filtros", () => {
    expect(
      build({ q: "a", role: "organizo", status: "esperando" }).where.group,
    ).toEqual({
      name: { contains: "a", mode: "insensitive" },
      ownerId: "u1",
      drawnAt: null,
    });
  });

  it("ordena por fecha con los grupos sin fecha al final y desempata por id", () => {
    const { orderBy } = build({ sort: "fecha" });
    expect(orderBy[0]).toEqual({
      group: { exchangeDate: { sort: "asc", nulls: "last" } },
    });
    expect(orderBy[orderBy.length - 1]).toEqual({ id: "asc" });
  });

  it("ordena por nombre y por antigüedad", () => {
    expect(build({ sort: "nombre" }).orderBy[0]).toEqual({ group: { name: "asc" } });
    expect(build({ sort: "antiguos" }).orderBy[0]).toEqual({ createdAt: "asc" });
  });
});

describe("todayIso", () => {
  it("usa la zona horaria de la app, no UTC", () => {
    // 2026-11-20 03:00 UTC sigue siendo 19 de noviembre en Ciudad de México.
    expect(todayIso(new Date("2026-11-20T03:00:00Z"))).toBe("2026-11-19");
    expect(todayIso(new Date("2026-11-20T15:00:00Z"))).toBe("2026-11-20");
  });
});

describe("paginación", () => {
  it("calcula el número de páginas (mínimo 1)", () => {
    expect(pageCount(0)).toBe(1);
    expect(pageCount(6)).toBe(1);
    expect(pageCount(7)).toBe(2);
    expect(pageCount(14)).toBe(3);
  });

  it("muestra todas las páginas si son pocas", () => {
    expect(pageWindow(1, 3)).toEqual([1, 2, 3]);
  });

  it("abrevia con puntos suspensivos", () => {
    expect(pageWindow(1, 10)).toEqual([1, 2, "…", 10]);
    expect(pageWindow(5, 10)).toEqual([1, "…", 4, 5, 6, "…", 10]);
    expect(pageWindow(10, 10)).toEqual([1, "…", 9, 10]);
    expect(pageWindow(3, 5)).toEqual([1, 2, 3, 4, 5]);
  });
});
