import { notFound } from "next/navigation";
import { getIndiePage } from "@/lib/supabase";
import IndiePageViewClient from "./IndiePageViewClient";

interface PageProps {
  params: Promise<{
    username: string;
  }>;
}

export default async function IndiePage({ params }: PageProps) {
  const resolvedParams = await params;
  const username = resolvedParams.username ? decodeURIComponent(resolvedParams.username).trim() : "";
  const cleanUser = username.replace(/^@/, "").trim();

  if (!cleanUser) {
    notFound();
  }

  const result = await getIndiePage(cleanUser);

  if (!result || !result.profile || result.profile.indie_page_enabled === false) {
    notFound();
  }

  return (
    <IndiePageViewClient
      initialProfile={result.profile}
      initialProducts={result.products || []}
      username={cleanUser}
    />
  );
}
