"use client";

import { useState, useEffect, useTransition } from "react";
import { PolarPayment, AdCampaign } from "@/lib/supabase";
import {
  CreditCard,
  DollarSign,
  ShieldCheck,
  Zap,
  TrendingUp,
  Megaphone,
  Award,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  RefreshCw,
  PlusCircle,
  ExternalLink,
  Layers,
  Sparkles,
  Server,
  Code2,
  FileText,
  Sliders
} from "lucide-react";
import {
  adminRecordManualPayment,
  adminUpdatePaymentStatus,
  adminTopUpAdBudget,
  adminGrantProMembership,
  adminSetProductFeatured,
  adminTestWebhookEndpoint,
  adminSetActiveGateway
} from "@/app/admin/_actions/payment-actions";

interface AdminPaymentsClientProps {
  initialPayments: PolarPayment[];
  initialCampaigns?: AdCampaign[];
}

export function AdminPaymentsClient({ initialPayments, initialCampaigns = [] }: AdminPaymentsClientProps) {
  const [payments, setPayments] = useState<PolarPayment[]>(initialPayments);
  const [campaigns, setCampaigns] = useState<AdCampaign[]>(initialCampaigns);
  const [activeTab, setActiveTab] = useState<"transactions" | "campaigns" | "gateways" | "features" | "record">("transactions");
  const [searchQuery, setSearchQuery] = useState("");
  const [providerFilter, setProviderFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedPayment, setSelectedPayment] = useState<PolarPayment | null>(null);

  // Active Gateway Switcher state (Dodo as default/exclusive MoR)
  const [activeGateway, setActiveGateway] = useState<"dodo" | "manual">("dodo");
  const [isSwitchingGateway, setIsSwitchingGateway] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const cached = localStorage.getItem("indihunt_payment_gateway_config");
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed.active_gateway) setActiveGateway(parsed.active_gateway === "manual" ? "manual" : "dodo");
        }
      } catch (e) {}
    }
  }, []);

  // Webhook test status for Dodo Payments
  const [testingDodo, setTestingDodo] = useState(false);
  const [dodoStatus, setDodoStatus] = useState<{ checked: boolean; ok: boolean; code?: number }>({ checked: false, ok: true, code: 200 });

  // Form states
  const [isPending, startTransition] = useTransition();
  const [toastMsg, setToastMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Ad Top-Up state
  const [adCampaignId, setAdCampaignId] = useState("");
  const [adTopUpAmount, setAdTopUpAmount] = useState("50");
  const [adNotes, setAdNotes] = useState("Admin promotional ad credit");

  // Pro Membership state
  const [proUserId, setProUserId] = useState("");
  const [proPlan, setProPlan] = useState("pro_annual");
  const [proDays, setProDays] = useState("365");

  // Featured Product state
  const [featProductId, setFeatProductId] = useState("");
  const [featDays, setFeatDays] = useState("30");

  // Manual payment state
  const [manUserId, setManUserId] = useState("");
  const [manAmount, setManAmount] = useState("99");
  const [manCurrency, setManCurrency] = useState("usd");
  const [manMethod, setManMethod] = useState("dodo");
  const [manFeature, setManFeature] = useState("ad_campaign");
  const [manNotes, setManNotes] = useState("Manual bank transfer payment");

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToastMsg({ text, type });
    setTimeout(() => setToastMsg(null), 4000);
  };

  const handleGatewayChange = (newGateway: "dodo" | "manual") => {
    setActiveGateway(newGateway);
    startTransition(async () => {
      setIsSwitchingGateway(true);
      await adminSetActiveGateway(newGateway);
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem(
            "indihunt_payment_gateway_config",
            JSON.stringify({
              active_gateway: newGateway,
              dodo_enabled: true,
              updated_at: new Date().toISOString()
            })
          );
        } catch (e) {}
      }
      setIsSwitchingGateway(false);
      showToast(`Active gateway switched to ${newGateway.toUpperCase()}`, "success");
    });
  };

  // Calculations
  const totalRevenue = payments
    .filter(p => p.status === "succeeded")
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  const succeededCount = payments.filter(p => p.status === "succeeded").length;
  const dodoCount = payments.filter(p => p.payment_method === "dodo" || !p.payment_method || p.payment_method === "polar").length;
  const manualCount = payments.filter(p => p.payment_method === "manual").length;

  const totalCampaignBudget = campaigns.reduce((sum, c) => sum + (c.total_budget || 0), 0);
  const totalTargetImpressions = campaigns.reduce((sum, c) => sum + (c.target_impressions || 0), 0);
  const totalDeliveredImpressions = campaigns.reduce((sum, c) => sum + (c.delivered_impressions || 0), 0);

  // Filtered Payments
  const filteredPayments = payments.filter((p) => {
    const matchesSearch =
      searchQuery === "" ||
      p.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.user_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.dodo_payment_id && p.dodo_payment_id.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesProvider = providerFilter === "all" || p.payment_method === providerFilter;
    const matchesStatus = statusFilter === "all" || p.status === statusFilter;

    return matchesSearch && matchesProvider && matchesStatus;
  });

  const handleTestWebhook = async () => {
    setTestingDodo(true);
    const res = await adminTestWebhookEndpoint("dodo");
    setDodoStatus({ checked: true, ok: res.success, code: res.status });
    setTestingDodo(false);

    if (res.success) {
      showToast("DODO Webhook Reachable (HTTP 200 OK)", "success");
    } else {
      showToast(`DODO Webhook Unreachable (HTTP ${res.status})`, "error");
    }
  };

  const handleStatusUpdate = (paymentId: string, newStatus: "succeeded" | "pending" | "failed" | "refunded") => {
    startTransition(async () => {
      await adminUpdatePaymentStatus(paymentId, newStatus, "Status updated by Admin");
      setPayments(prev => prev.map(p => p.id === paymentId ? { ...p, status: newStatus } : p));
      showToast(`Payment ${paymentId} status changed to '${newStatus}'`, "success");
    });
  };

  const handleAdTopUpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adCampaignId) return showToast("Please enter a Campaign ID", "error");
    startTransition(async () => {
      await adminTopUpAdBudget(adCampaignId, parseFloat(adTopUpAmount), adNotes);
      showToast(`Added $${adTopUpAmount} budget to campaign '${adCampaignId}'`, "success");
      setAdCampaignId("");
    });
  };

  const handleProMembershipSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!proUserId) return showToast("Please enter a User ID", "error");
    startTransition(async () => {
      await adminGrantProMembership(proUserId, proPlan, parseInt(proDays, 10));
      showToast(`Granted Pro (${proPlan}) to User '${proUserId}' for ${proDays} days`, "success");
      setProUserId("");
    });
  };

  const handleFeaturedSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!featProductId) return showToast("Please enter a Product ID", "error");
    startTransition(async () => {
      await adminSetProductFeatured(featProductId, true, parseInt(featDays, 10));
      showToast(`Granted Featured status to Product '${featProductId}' for ${featDays} days`, "success");
      setFeatProductId("");
    });
  };

  const handleManualPaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manUserId) return showToast("Please enter a User ID", "error");

    const formData = new FormData();
    formData.append("userId", manUserId);
    formData.append("amount", manAmount);
    formData.append("currency", manCurrency);
    formData.append("paymentMethod", manMethod);
    formData.append("featureType", manFeature);
    formData.append("notes", manNotes);

    startTransition(async () => {
      await adminRecordManualPayment(formData);
      const newPay: PolarPayment = {
        id: `pay_man_${Date.now()}`,
        user_id: manUserId,
        amount: parseFloat(manAmount),
        currency: manCurrency,
        status: "succeeded",
        payment_method: manMethod,
        metadata: { type: manFeature, notes: manNotes, manual: true },
        created_at: new Date().toISOString()
      };
      setPayments(prev => [newPay, ...prev]);
      showToast(`Recorded $${manAmount} manual payment for User '${manUserId}'`, "success");
      setManUserId("");
    });
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto pb-20">
      {/* Toast */}
      {toastMsg && (
        <div
          className={`fixed top-5 right-5 z-[10000] px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 border text-sm font-semibold transition-all animate-bounce ${
            toastMsg.type === "success"
              ? "bg-emerald-950 text-emerald-300 border-emerald-500/30"
              : "bg-rose-950 text-rose-300 border-rose-500/30"
          }`}
        >
          {toastMsg.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-400" />
          )}
          {toastMsg.text}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <CreditCard className="w-5.5 h-5.5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Payment Systems & Features
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Command center for Dodo Payments Merchant of Record, ad budgets, transaction ledgers, and paid features.
            </p>
          </div>
        </div>

        <button
          onClick={() => setActiveTab("record")}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold text-sm shadow-md shadow-orange-500/20 transition-all cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          Log Manual Payment
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Revenue</div>
            <div className="text-2xl font-black text-slate-900 mt-1">${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            <div className="text-xs text-emerald-600 font-semibold mt-1 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" /> {succeededCount} paid transactions
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Dodo Payments</div>
            <div className="text-2xl font-black text-slate-900 mt-1">{dodoCount} Orders</div>
            <div className="text-xs text-amber-600 font-semibold mt-1 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" /> Exclusive MoR Engine
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
            <Zap className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Campaign Budgets</div>
            <div className="text-2xl font-black text-slate-900 mt-1">${totalCampaignBudget.toFixed(0)} Sold</div>
            <div className="text-xs text-purple-600 font-semibold mt-1 flex items-center gap-1">
              <Megaphone className="w-3.5 h-3.5" /> {totalTargetImpressions.toLocaleString()} targets
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
            <CreditCard className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Manual & Promo</div>
            <div className="text-2xl font-black text-slate-900 mt-1">{manualCount} Transactions</div>
            <div className="text-xs text-slate-600 font-semibold mt-1 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" /> Promo / Wire
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-600">
            <Award className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 overflow-x-auto">
        <button
          onClick={() => setActiveTab("transactions")}
          className={`px-5 py-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "transactions"
              ? "border-orange-500 text-orange-600 bg-orange-50/50"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <FileText className="w-4 h-4" />
          All Transactions & Logs ({payments.length})
        </button>

        <button
          onClick={() => setActiveTab("campaigns")}
          className={`px-5 py-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "campaigns"
              ? "border-orange-500 text-orange-600 bg-orange-50/50"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <Megaphone className="w-4 h-4" />
          Campaign Revenues (${totalCampaignBudget.toFixed(0)})
        </button>

        <button
          onClick={() => setActiveTab("gateways")}
          className={`px-5 py-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "gateways"
              ? "border-orange-500 text-orange-600 bg-orange-50/50"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <Server className="w-4 h-4" />
          Gateway Health & Webhooks
        </button>

        <button
          onClick={() => setActiveTab("features")}
          className={`px-5 py-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "features"
              ? "border-orange-500 text-orange-600 bg-orange-50/50"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <Sparkles className="w-4 h-4" />
          Paid Features Control
        </button>

        <button
          onClick={() => setActiveTab("record")}
          className={`px-5 py-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "record"
              ? "border-orange-500 text-orange-600 bg-orange-50/50"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <PlusCircle className="w-4 h-4" />
          Manual Payment Form
        </button>
      </div>

      {/* TAB 1: TRANSACTIONS TABLE */}
      {activeTab === "transactions" && (
        <div className="space-y-4">
          {/* Controls */}
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search payment ID, order ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-slate-900"
              />
            </div>

            <div className="flex gap-2 w-full sm:w-auto">
              <select
                value={providerFilter}
                onChange={(e) => setProviderFilter(e.target.value)}
                className="px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl font-medium text-slate-700 focus:outline-none"
              >
                <option value="all">All Providers</option>
                <option value="dodo">Dodo Payments</option>
                <option value="manual">Manual / Promo</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl font-medium text-slate-700 focus:outline-none"
              >
                <option value="all">All Statuses</option>
                <option value="succeeded">Succeeded</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
                <option value="refunded">Refunded</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold text-xs uppercase tracking-wider text-left">
                    <th className="px-4 py-3">Transaction ID</th>
                    <th className="px-4 py-3">User / Customer</th>
                    <th className="px-4 py-3">Provider</th>
                    <th className="px-4 py-3">Feature</th>
                    <th className="px-4 py-3">Amount</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredPayments.map((p) => {
                    const statusColor =
                      p.status === "succeeded"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : p.status === "refunded"
                        ? "bg-rose-50 text-rose-700 border-rose-200"
                        : "bg-amber-50 text-amber-700 border-amber-200";

                    return (
                      <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-4 py-3.5 font-mono text-xs font-semibold text-slate-800">
                          {p.id}
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="font-semibold text-slate-900 truncate max-w-[140px]">{p.user_id}</div>
                          {p.polar_order_id && (
                            <div className="text-xs text-slate-400 font-mono truncate max-w-[140px]">{p.polar_order_id}</div>
                          )}
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="px-2.5 py-1 rounded-lg bg-slate-100 font-semibold text-slate-700 text-xs uppercase tracking-wide">
                            {p.payment_method}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-slate-600 font-medium capitalize">
                          {p.metadata?.type || (p.campaign_id ? "ad_campaign" : "general_payment")}
                        </td>
                        <td className="px-4 py-3.5 font-bold text-slate-900">
                          ${p.amount?.toFixed(2)} <span className="text-xs font-normal text-slate-400 uppercase">{p.currency}</span>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className={`px-2.5 py-0.5 rounded-full border text-xs font-semibold uppercase ${statusColor}`}>
                            {p.status}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-xs text-slate-500 whitespace-nowrap">
                          {new Date(p.created_at).toLocaleString()}
                        </td>
                        <td className="px-4 py-3.5 text-right space-x-1">
                          <button
                            onClick={() => setSelectedPayment(p)}
                            className="px-2.5 py-1 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-all cursor-pointer"
                          >
                            Details
                          </button>
                          {p.status !== "refunded" && (
                            <button
                              onClick={() => handleStatusUpdate(p.id, "refunded")}
                              className="px-2.5 py-1 text-xs font-semibold bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition-all cursor-pointer"
                            >
                              Refund
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {filteredPayments.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400">
                        No transactions found matching filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB: CAMPAIGN REVENUES & AD BUDGET ANALYTICS */}
      {activeTab === "campaigns" && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Ad Budget Sold</div>
                <div className="text-2xl font-black text-slate-900 mt-1">${totalCampaignBudget.toFixed(2)}</div>
                <div className="text-xs text-purple-600 font-semibold mt-1">
                  Across {campaigns.length} campaigns
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
                <Megaphone className="w-5 h-5" />
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Target Impressions</div>
                <div className="text-2xl font-black text-slate-900 mt-1">{totalTargetImpressions.toLocaleString()}</div>
                <div className="text-xs text-orange-600 font-semibold mt-1">
                  Guaranteed delivery
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600">
                <Megaphone className="w-5 h-5" />
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Delivered Impressions</div>
                <div className="text-2xl font-black text-slate-900 mt-1">{totalDeliveredImpressions.toLocaleString()}</div>
                <div className="text-xs text-emerald-600 font-semibold mt-1">
                  {totalTargetImpressions > 0 ? ((totalDeliveredImpressions / totalTargetImpressions) * 100).toFixed(1) : 0}% delivery rate
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Campaign Revenue Table */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">Campaign Revenue & Spend Breakdown</h3>
                <p className="text-xs text-slate-500">Live ad campaign performance and budget tracking</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold text-xs uppercase tracking-wider text-left">
                    <th className="px-4 py-3">Advertiser</th>
                    <th className="px-4 py-3">Campaign Name</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Total Budget</th>
                    <th className="px-4 py-3">Target Imps.</th>
                    <th className="px-4 py-3">Delivered</th>
                    <th className="px-4 py-3">Impressions</th>
                    <th className="px-4 py-3">Clicks</th>
                    <th className="px-4 py-3">CTR</th>
                    <th className="px-4 py-3 text-right">Quick Top-Up</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {campaigns.map((c) => {
                    const ctr = c.impressions > 0 ? ((c.clicks / c.impressions) * 100).toFixed(2) : "0.00";
                    const statusStyle =
                      c.status === "active"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : c.status === "paused"
                        ? "bg-amber-50 text-amber-700 border-amber-200"
                        : "bg-slate-100 text-slate-600 border-slate-200";

                    return (
                      <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-4 py-3.5 font-semibold text-slate-800">
                          @{(c.user as any)?.username || c.user_id}
                        </td>
                        <td className="px-4 py-3.5 max-w-[200px]">
                          <div className="font-bold text-slate-900 truncate">{c.name}</div>
                          <div className="text-xs text-slate-400 truncate mt-0.5">{c.headline}</div>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className={`px-2.5 py-0.5 rounded-full border text-xs font-semibold uppercase ${statusStyle}`}>
                            {c.status}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 font-bold text-slate-900">
                          ${c.total_budget?.toFixed(2)}
                        </td>
                        <td className="px-4 py-3.5 text-orange-600 font-semibold">
                          {c.target_impressions?.toLocaleString()}
                        </td>
                        <td className="px-4 py-3.5 text-emerald-600 font-semibold">
                          {c.delivered_impressions?.toLocaleString()}
                        </td>
                        <td className="px-4 py-3.5 text-slate-600">
                          {c.impressions?.toLocaleString()}
                        </td>
                        <td className="px-4 py-3.5 text-slate-600">
                          {c.clicks?.toLocaleString()}
                        </td>
                        <td className="px-4 py-3.5 text-purple-600 font-bold">
                          {ctr}%
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <button
                            onClick={() => {
                              setAdCampaignId(c.id);
                              setActiveTab("features");
                            }}
                            className="px-3 py-1 text-xs font-bold bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg transition-all cursor-pointer"
                          >
                            + Top Up
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {campaigns.length === 0 && (
                    <tr>
                      <td colSpan={10} className="py-12 text-center text-slate-400">
                        No ad campaigns found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: GATEWAY HEALTH & CONFIGURATION */}
      {activeTab === "gateways" && (
        <div className="space-y-6">
          {/* PRIMARY GATEWAY BANNER */}
          <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/5 border-2 border-amber-500/20 rounded-2xl p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-600" />
                  <h3 className="font-bold text-slate-900 text-lg">Default & Exclusive Payment Gateway</h3>
                </div>
                <p className="text-xs text-slate-600 mt-1">
                  Dodo Payments is configured as IndiHunt&apos;s exclusive Merchant of Record for sponsored ads, billboard bids, and checkout operations.
                </p>
              </div>

              <div className="inline-flex p-1.5 bg-white border border-slate-200 rounded-xl shadow-xs gap-1">
                <button
                  type="button"
                  onClick={() => handleGatewayChange("dodo")}
                  disabled={isSwitchingGateway}
                  className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeGateway === "dodo"
                      ? "bg-amber-600 text-white shadow-xs"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Dodo Payments (Default)
                  {activeGateway === "dodo" && <span className="w-1.5 h-1.5 rounded-full bg-white ml-1 animate-pulse" />}
                </button>

                <button
                  type="button"
                  onClick={() => handleGatewayChange("manual")}
                  disabled={isSwitchingGateway}
                  className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeGateway === "manual"
                      ? "bg-slate-800 text-white shadow-xs"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                  }`}
                >
                  <Award className="w-3.5 h-3.5" />
                  Manual / Wire
                  {activeGateway === "manual" && <span className="w-1.5 h-1.5 rounded-full bg-white ml-1 animate-pulse" />}
                </button>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-amber-500/10 flex items-center justify-between text-xs text-slate-500">
              <span>
                Active Gateway Engine: <strong className="text-slate-900 font-bold uppercase">{activeGateway === "dodo" ? "Dodo Payments (MoR)" : "Manual / Wire Only"}</strong>
              </span>
              <span className="text-emerald-600 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Direct checkout & webhook sync active
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* DODO PAYMENTS GATEWAY CARD */}
            <div className={`bg-white border rounded-2xl p-5 shadow-xs space-y-4 ${activeGateway === "dodo" ? "border-amber-400 ring-2 ring-amber-500/10" : "border-slate-200"}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">Dodo Payments</h3>
                    <p className="text-xs text-slate-500">Exclusive Merchant of Record & Checkout Engine</p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full text-xs font-bold uppercase border bg-amber-50 text-amber-700 border-amber-200">
                  Default MoR
                </span>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl space-y-2 text-xs font-mono text-slate-700 border border-slate-200">
                <div className="flex justify-between">
                  <span className="text-slate-400">Webhook URL:</span>
                  <span className="font-semibold text-slate-900">https://indihunt.in/t/webhooks/dodo</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Checkout API:</span>
                  <span className="text-slate-900 font-semibold">/t/checkout/dodo</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">GET/HEAD Health:</span>
                  <span className="text-emerald-600 font-bold">200 OK Supported</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={() => handleTestWebhook()}
                  disabled={testingDodo}
                  className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-xl transition-all cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${testingDodo ? "animate-spin" : ""}`} />
                  {testingDodo ? "Testing..." : "Test Dodo Webhook"}
                </button>

                {dodoStatus.checked && (
                  <span className={`text-xs font-semibold ${dodoStatus.ok ? "text-emerald-600" : "text-rose-600"}`}>
                    Status: HTTP {dodoStatus.code} ({dodoStatus.ok ? "Reachable" : "Error"})
                  </span>
                )}
              </div>
            </div>

            {/* MANUAL / CREDITS CARD */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600">
                    <Award className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">Manual & Admin Overrides</h3>
                    <p className="text-xs text-slate-500">Bank Transfers, Wire, Admin Grants & Promo</p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold uppercase">
                  Available
                </span>
              </div>

              <p className="text-xs text-slate-600">
                Allows administrators to record custom off-platform payments, issue ad budget top-ups, and grant Pro maker badges directly without requiring an online checkout flow.
              </p>

              <button
                onClick={() => setActiveTab("record")}
                className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                Open Manual Payment Form →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: PAID FEATURES MANAGER */}
      {activeTab === "features" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* AD BUDGET TOP-UP */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
                <Megaphone className="w-4.5 h-4.5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Ad Campaign Top-Up</h3>
                <p className="text-xs text-slate-400">Add budget directly to ad campaigns</p>
              </div>
            </div>

            <form onSubmit={handleAdTopUpSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Campaign ID</label>
                <input
                  type="text"
                  placeholder="cmp_..."
                  value={adCampaignId}
                  onChange={(e) => setAdCampaignId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 text-slate-900 font-mono"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Amount ($ USD)</label>
                <input
                  type="number"
                  value={adTopUpAmount}
                  onChange={(e) => setAdTopUpAmount(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 text-slate-900 font-semibold"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Notes</label>
                <input
                  type="text"
                  value={adNotes}
                  onChange={(e) => setAdNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 text-slate-900"
                />
              </div>

              <button
                type="submit"
                disabled={isPending}
                className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
              >
                Top-Up Ad Campaign Balance
              </button>
            </form>
          </div>

          {/* PRO MAKER MEMBERSHIP */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <div className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600">
                <Sparkles className="w-4.5 h-4.5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Grant Pro Membership</h3>
                <p className="text-xs text-slate-400">Upgrade maker profile to Pro status</p>
              </div>
            </div>

            <form onSubmit={handleProMembershipSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">User ID / Profile ID</label>
                <input
                  type="text"
                  placeholder="usr_..."
                  value={proUserId}
                  onChange={(e) => setProUserId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 text-slate-900 font-mono"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Plan Tier</label>
                  <select
                    value={proPlan}
                    onChange={(e) => setProPlan(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none font-semibold text-slate-800"
                  >
                    <option value="pro_annual">Pro Annual</option>
                    <option value="pro_monthly">Pro Monthly</option>
                    <option value="pro_lifetime">Pro Lifetime</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Duration (Days)</label>
                  <input
                    type="number"
                    value={proDays}
                    onChange={(e) => setProDays(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none text-slate-900 font-semibold"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isPending}
                className="w-full py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-semibold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
              >
                Grant Pro Membership Badge
              </button>
            </form>
          </div>

          {/* FEATURED PRODUCT SLOT */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                <Award className="w-4.5 h-4.5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Feature Product Listing</h3>
                <p className="text-xs text-slate-400">Boost product to Featured Feed</p>
              </div>
            </div>

            <form onSubmit={handleFeaturedSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Product ID / Slug</label>
                <input
                  type="text"
                  placeholder="prd_... or slug"
                  value={featProductId}
                  onChange={(e) => setFeatProductId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-900 font-mono"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Duration (Days)</label>
                <input
                  type="number"
                  value={featDays}
                  onChange={(e) => setFeatDays(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none text-slate-900 font-semibold"
                />
              </div>

              <button
                type="submit"
                disabled={isPending}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
              >
                Set Featured Product Status
              </button>
            </form>
          </div>
        </div>
      )}

      {/* TAB 4: MANUAL PAYMENT FORM */}
      {activeTab === "record" && (
        <div className="max-w-2xl bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-lg font-bold text-slate-900">Log Manual Off-Platform Payment</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Record payments received via bank transfer, cheque, wire, or issue promotional credits.
            </p>
          </div>

          <form onSubmit={handleManualPaymentSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">User ID / Maker ID *</label>
                <input
                  type="text"
                  placeholder="usr_..."
                  value={manUserId}
                  onChange={(e) => setManUserId(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 text-slate-900 font-mono"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Amount *</label>
                <input
                  type="number"
                  step="0.01"
                  value={manAmount}
                  onChange={(e) => setManAmount(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 text-slate-900 font-bold"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Currency</label>
                <select
                  value={manCurrency}
                  onChange={(e) => setManCurrency(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none font-semibold text-slate-800"
                >
                  <option value="usd">USD ($)</option>
                  <option value="inr">INR (₹)</option>
                  <option value="eur">EUR (€)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Payment Method</label>
                <select
                  value={manMethod}
                  onChange={(e) => setManMethod(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none font-semibold text-slate-800"
                >
                  <option value="dodo">Dodo Payments</option>
                  <option value="manual">Manual Bank Wire / Credit</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Feature Category</label>
                <select
                  value={manFeature}
                  onChange={(e) => setManFeature(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none font-semibold text-slate-800"
                >
                  <option value="ad_campaign">Ad Campaign Credit</option>
                  <option value="featured_product">Featured Product Slot</option>
                  <option value="pro_membership">Pro Membership</option>
                  <option value="sponsorship">Newsletter Sponsorship</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Internal Reference / Notes</label>
              <textarea
                rows={3}
                placeholder="Include reference number, bank transaction ID, or promo rationale..."
                value={manNotes}
                onChange={(e) => setManNotes(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 text-slate-900"
              />
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm rounded-xl shadow-md shadow-orange-500/20 transition-all cursor-pointer"
            >
              Record & Apply Payment
            </button>
          </form>
        </div>
      )}

      {/* DETAIL MODAL */}
      {selectedPayment && (
        <div className="fixed inset-0 z-[10000] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">Payment Details #{selectedPayment.id}</h3>
              <button
                onClick={() => setSelectedPayment(null)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 text-xs font-mono bg-slate-50 p-4 rounded-xl border border-slate-200 overflow-x-auto max-h-60 text-slate-800">
              <pre>{JSON.stringify(selectedPayment, null, 2)}</pre>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setSelectedPayment(null)}
                className="px-4 py-2 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
