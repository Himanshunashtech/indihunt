import { redirect } from "next/navigation";

export const revalidate = 3600;

export default function LaunchInsightsRootPage() {
  const d = new Date();
  const year = d.getFullYear();
  const month = d.getMonth() + 1;
  const day = d.getDate();

  redirect(`/launch-insights/${year}/${month}/${day}`);
}
