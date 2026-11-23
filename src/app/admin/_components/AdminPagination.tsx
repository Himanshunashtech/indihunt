"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

interface AdminPaginationProps {
  page: number;
  totalCount: number;
  limit: number;
  limitOptions?: number[];
}

export function AdminPagination({
  page,
  totalCount,
  limit,
  limitOptions = [20, 50, 100],
}: AdminPaginationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const totalPages = Math.ceil(totalCount / limit);
  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, totalCount);

  const navigate = (newPage: number, newLimit?: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(newPage));
    if (newLimit !== undefined) {
      params.set("limit", String(newLimit));
      params.set("page", "1");
    }
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  if (totalCount === 0) return null;

  // Build page window: [1] ... [page-1] [page] [page+1] ... [totalPages]
  const pageButtons: (number | "...")[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pageButtons.push(i);
  } else {
    pageButtons.push(1);
    if (page > 3) pageButtons.push("...");
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
      pageButtons.push(i);
    }
    if (page < totalPages - 2) pageButtons.push("...");
    pageButtons.push(totalPages);
  }

  return (
    <div
      className={`flex flex-col sm:flex-row items-center justify-between gap-3 py-4 px-1 transition-opacity ${
        isPending ? "opacity-50" : "opacity-100"
      }`}
    >
      {/* Left: count info */}
      <div className="flex items-center gap-3 text-base text-slate-500 font-normal">
        <span>
          Showing{" "}
          <span className="text-slate-800 font-semibold">{from.toLocaleString()}–{to.toLocaleString()}</span>{" "}
          of{" "}
          <span className="text-slate-800 font-semibold">{totalCount.toLocaleString()}</span>{" "}
          results
        </span>

        {/* Per-page selector */}
        <div className="flex items-center gap-1.5">
          <span className="text-slate-400">Per page:</span>
          <select
            value={limit}
            onChange={(e) => navigate(1, Number(e.target.value))}
            className="bg-slate-100 border border-slate-200 text-slate-800 text-base rounded-lg px-2 py-1 focus:outline-none focus:border-orange-500/50 cursor-pointer"
          >
            {limitOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Right: page controls */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => navigate(1)}
          disabled={page === 1}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          title="First page"
        >
          <ChevronsLeft className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => navigate(page - 1)}
          disabled={page === 1}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          title="Previous page"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>

        {pageButtons.map((btn, i) =>
          btn === "..." ? (
            <span key={`ellipsis-${i}`} className="px-2 text-slate-300 text-base select-none">
              …
            </span>
          ) : (
            <button
              key={btn}
              onClick={() => navigate(btn as number)}
              className={`min-w-[30px] h-[30px] px-2 rounded-lg text-base font-semibold transition-all ${
                btn === page
                  ? "bg-orange-500 text-slate-900 shadow-lg shadow-orange-500/20"
                  : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              {btn}
            </button>
          )
        )}

        <button
          onClick={() => navigate(page + 1)}
          disabled={page >= totalPages}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          title="Next page"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => navigate(totalPages)}
          disabled={page >= totalPages}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          title="Last page"
        >
          <ChevronsRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
