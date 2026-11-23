import React, { cache } from "react";
import { redirect, RedirectType } from "next/navigation";
import { getThreadById, getComments, getProductById, getProductSlug, Thread, Comment, Product } from "@/lib/supabase";
import ThreadDetailPageClient from "./ThreadDetailPageClient";

export const revalidate = 60; // ISR: Revalidate thread details every 60 seconds

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

const getThreadPageData = cache(async (id: string) => {
  let initialThread: Thread | null = null;
  let initialComments: Comment[] = [];
  let initialProduct: Product | null = null;

  try {
    initialThread = await getThreadById(id);
    if (initialThread) {
      const [commentsData, productData] = await Promise.all([
        getComments(undefined, initialThread.id).catch(() => [] as Comment[]),
        initialThread.product_id ? getProductById(initialThread.product_id).catch(() => null) : null,
      ]);
      initialComments = commentsData;
      initialProduct = productData;
    }
  } catch {
    // Client fallback will load via hooks
  }

  return { initialThread, initialComments, initialProduct };
});

export default async function ThreadPage({ params }: PageProps) {
  const { id } = await params;
  const { initialThread, initialComments, initialProduct } = await getThreadPageData(id);

  if (initialThread && initialThread.title) {
    const slug = getProductSlug(initialThread.title);
    if (slug && id.toLowerCase() !== slug.toLowerCase()) {
      redirect(`/threads/${slug}`, RedirectType.replace);
    }
  }

  return (
    <ThreadDetailPageClient
      initialThread={initialThread}
      initialComments={initialComments}
      initialProduct={initialProduct}
      threadId={id}
    />
  );
}

