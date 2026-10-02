import { cache } from "react";
import { unstable_cache } from "next/cache";
import { getProductById } from "@/lib/supabase";

// dedupes within a request + caches across requests
export const getProductCached = cache((id: string) => {
  const cleanId = (id || "").toLowerCase().trim();
  return unstable_cache(
    async () => {
      const prod = await getProductById(cleanId);
      return prod;
    },
    ["product_v3", cleanId],
    {
      revalidate: 60,
      tags: [`product-${cleanId}`],
    }
  )();
});

