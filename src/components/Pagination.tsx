import Link from "next/link";
import {
  type GroupListParams,
  groupListHref,
  PAGE_SIZE,
  pageCount,
  pageWindow,
} from "@/lib/group-list";

const pageClass =
  "flex h-9 min-w-9 items-center justify-center rounded-full px-3 text-sm font-bold transition focus-visible:outline-2 focus-visible:outline-gold";

/** Paginación numerada de "Mis grupos"; conserva el resto de parámetros. */
export function Pagination({
  params,
  total,
}: {
  params: GroupListParams;
  total: number;
}) {
  const pages = pageCount(total);
  if (pages <= 1) return null;

  const from = (params.page - 1) * PAGE_SIZE + 1;
  const to = Math.min(params.page * PAGE_SIZE, total);
  const href = (page: number) => groupListHref({ ...params, page });

  return (
    <nav
      aria-label="Paginación de grupos"
      className="mt-6 flex flex-col items-center gap-3"
    >
      <p className="text-sm text-snow/70">
        Mostrando {from}–{to} de {total}
      </p>
      <ul className="flex flex-wrap items-center justify-center gap-1.5">
        <li>
          {params.page > 1 ? (
            <Link
              href={href(params.page - 1)}
              className={`${pageClass} bg-cream text-pine hover:bg-white`}
            >
              ← Anterior
            </Link>
          ) : (
            <span className={`${pageClass} bg-cream/20 text-snow/40`}>
              ← Anterior
            </span>
          )}
        </li>

        {pageWindow(params.page, pages).map((page, index) =>
          page === "…" ? (
            <li key={`gap-${index}`} aria-hidden="true" className="px-1 text-snow/50">
              …
            </li>
          ) : (
            <li key={page}>
              <Link
                href={href(page)}
                aria-label={`Página ${page}`}
                aria-current={page === params.page ? "page" : undefined}
                className={`${pageClass} ${
                  page === params.page
                    ? "bg-berry text-white shadow-md shadow-berry-dark/40"
                    : "bg-cream text-pine hover:bg-white"
                }`}
              >
                {page}
              </Link>
            </li>
          ),
        )}

        <li>
          {params.page < pages ? (
            <Link
              href={href(params.page + 1)}
              className={`${pageClass} bg-cream text-pine hover:bg-white`}
            >
              Siguiente →
            </Link>
          ) : (
            <span className={`${pageClass} bg-cream/20 text-snow/40`}>
              Siguiente →
            </span>
          )}
        </li>
      </ul>
    </nav>
  );
}
