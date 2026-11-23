import { redirect, RedirectType } from "next/navigation";

export default function LeaderboardRedirectPage() {
  redirect("/best-products", RedirectType.replace);
}
