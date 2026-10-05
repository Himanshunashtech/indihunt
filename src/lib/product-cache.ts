import { cache } from "react";
import { getProductById } from "@/lib/supabase";

// Request-level deduplication so multiple server components / helpers don't refetch the same product in a single render
export const getProductCached = cache(async (id: string) => {
  const cleanId = (id || "").toLowerCase().trim();
  return getProductById(cleanId);
});

