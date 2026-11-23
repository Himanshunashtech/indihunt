import { redirect } from "next/navigation";

// The middleware already guarantees only admins reach here.
// Simply redirect to the dashboard.
export default function AdminRootPage() {
  redirect("/admin/dashboard");
}
