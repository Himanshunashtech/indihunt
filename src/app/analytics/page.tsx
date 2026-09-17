"use client";


import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AnalyticsRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = d.getMonth() + 1;
    const day = d.getDate();
    router.replace(`/launch-insights/${year}/${month}/${day}`);
  }, [router]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-3">
      <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
      <span className="text-xs text-muted-foreground font-medium">Redirecting to Launch Insights...</span>
    </div>
  );
}
