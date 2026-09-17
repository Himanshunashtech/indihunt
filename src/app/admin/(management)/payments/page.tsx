import { getAllPolarPayments, getAllAdCampaignsAllUsers, PolarPayment, AdCampaign } from "@/lib/supabase";
import { AdminPaymentsClient } from "./AdminPaymentsClient";

export const metadata = {
  title: "Payment Systems & Paid Features | Admin Console | IndiHunt",
  description: "Manage Dodo Payments Merchant of Record, transaction audit logs, ad campaign budgets, featured product slots, and Pro maker memberships."
};

export default async function AdminPaymentsPage() {
  const initialPayments: PolarPayment[] = await getAllPolarPayments();
  const initialCampaigns: AdCampaign[] = await getAllAdCampaignsAllUsers();

  return <AdminPaymentsClient initialPayments={initialPayments} initialCampaigns={initialCampaigns} />;
}
