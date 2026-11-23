"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useTransition, useState, useEffect } from "react";
import { Search, X } from "lucide-react";

interface AdminSearchProps {
  placeholder?: string;
  paramKey?: string;
}

export function AdminSearch({
  placeholder = "Search...",
  paramKey = "q",
}: AdminSearchProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [value, setValue] = useState(searchParams.get(paramKey) || "");

  // Sync with URL on mount
  useEffect(() => {
    setValue(searchParams.get(paramKey) || "");
  }, [searchParams, paramKey]);

  // 300ms debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(paramKey, value);
      } else {
        params.delete(paramKey);
      }
      params.set("page", "1"); // reset to page 1 on new search
      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`);
      });
    }, 300);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const clear = () => {
    setValue("");
    const params = new URLSearchParams(searchParams.toString());
    params.delete(paramKey);
    params.set("page", "1");
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  return (
    <div className="relative">
      <Search
        className={`w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors ${
          isPending ? "text-orange-400 animate-pulse" : "text-slate-400"
        }`}
      />
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-9 pr-9 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-base text-slate-900 placeholder-white/25 focus:outline-none focus:border-orange-500/40 focus:bg-slate-200 transition-all font-normal"
      />
      {value && (
        <button
          onClick={clear}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}
