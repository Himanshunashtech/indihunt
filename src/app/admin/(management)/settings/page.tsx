import { Suspense } from "react";
import { createServerSupabase } from "@/lib/supabase-server";
import {
  Settings,
  ToggleLeft,
  ToggleRight,
  Save,
  Loader2,
  Sliders,
  Shield,
  Zap,
} from "lucide-react";
import { adminUpdateSetting, adminToggleFeatureFlag } from "@/app/admin/_actions/admin-actions";

export const metadata = { title: "Settings | Admin Console | IndiHunt" };

interface PageProps {
  searchParams: Promise<{ tab?: string }>;
}

// ─── Platform Settings ────────────────────────────────────────────────────
async function PlatformSettings() {
  const supabase = await createServerSupabase();
  const { data: settings } = await supabase
    .from("platform_settings")
    .select("key, value, category, description, updated_at")
    .order("category");

  // Group by category
  const grouped: Record<string, typeof settings> = {};
  (settings || []).forEach((s) => {
    if (!grouped[s.category]) grouped[s.category] = [];
    grouped[s.category]!.push(s);
  });

  const categoryLabels: Record<string, { label: string; icon: typeof Settings }> = {
    general: { label: "General", icon: Settings },
    launch_rules: { label: "Launch Rules", icon: Zap },
    voting: { label: "Voting", icon: Sliders },
    moderation: { label: "Moderation", icon: Shield },
  };

  return (
    <div className="space-y-6">
      {Object.entries(grouped).map(([category, items]) => {
        const cat = categoryLabels[category] || { label: category, icon: Settings };
        const Icon = cat.icon;
        return (
          <div key={category} className="bg-white border border-slate-200 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-5">
              <Icon className="w-4 h-4 text-slate-500" />
              <h3 className="text-sm font-semibold text-slate-900 capitalize">{cat.label}</h3>
            </div>
            <div className="space-y-4">
              {(items || []).map((setting) => {
                const displayValue = typeof setting.value === "string"
                  ? setting.value
                  : JSON.stringify(setting.value);
                return (
                  <form
                    key={setting.key}
                    action={async (formData: FormData) => {
                      "use server";
                      const val = formData.get("value") as string;
                      // Wrap strings in quotes for JSON, pass numbers/booleans as-is
                      let jsonVal = val;
                      if (val === "true" || val === "false" || !isNaN(Number(val))) {
                        jsonVal = val;
                      } else {
                        jsonVal = JSON.stringify(val);
                      }
                      await adminUpdateSetting(setting.key, jsonVal);
                    }}
                    className="flex items-center gap-4"
                  >
                    <div className="flex-1 min-w-0">
                      <label className="block text-sm font-medium text-slate-700">{setting.key.replace(/_/g, " ")}</label>
                      <p className="text-xs text-slate-400 mt-0.5">{setting.description}</p>
                    </div>
                    <input
                      name="value"
                      defaultValue={displayValue.replace(/^"|"$/g, "")}
                      className="w-52 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:border-orange-500/40 transition-colors"
                    />
                    <button
                      type="submit"
                      className="p-2 rounded-lg bg-slate-100 hover:bg-orange-500/10 text-slate-500 hover:text-orange-400 transition-all"
                    >
                      <Save className="w-3.5 h-3.5" />
                    </button>
                  </form>
                );
              })}
            </div>
          </div>
        );
      })}
      {Object.keys(grouped).length === 0 && (
        <div className="py-16 text-center text-slate-400 text-sm">No settings found. Run migration 71 first.</div>
      )}
    </div>
  );
}

// ─── Feature Flags ────────────────────────────────────────────────────────
async function FeatureFlags() {
  const supabase = await createServerSupabase();
  const { data: flags } = await supabase
    .from("feature_flags")
    .select("key, enabled, description, updated_at")
    .order("key");

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-5">
        <Zap className="w-4 h-4 text-amber-400" />
        <h3 className="text-sm font-semibold text-slate-900">Feature Flags</h3>
      </div>
      <div className="space-y-3">
        {(flags || []).map((flag) => (
          <div key={flag.key} className="flex items-center justify-between gap-4 p-3 bg-slate-50 rounded-xl">
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium text-slate-800">{flag.key.replace(/_/g, " ")}</div>
              <p className="text-xs text-slate-400 mt-0.5">{flag.description}</p>
            </div>
            <form action={async () => {
              "use server";
              await adminToggleFeatureFlag(flag.key, !flag.enabled);
            }}>
              <button type="submit" className="flex items-center gap-2 transition-all">
                {flag.enabled ? (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 text-emerald-400 rounded-lg">
                    <ToggleRight className="w-5 h-5" />
                    <span className="text-xs font-bold">ON</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-200 text-slate-400 rounded-lg">
                    <ToggleLeft className="w-5 h-5" />
                    <span className="text-xs font-bold">OFF</span>
                  </div>
                )}
              </button>
            </form>
          </div>
        ))}
        {(!flags || flags.length === 0) && (
          <div className="py-8 text-center text-slate-400 text-sm">No feature flags found. Run migration 71 first.</div>
        )}
      </div>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────
export default async function AdminSettingsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const tab = params.tab || "settings";

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-slate-200 flex items-center justify-center">
          <Settings className="w-4.5 h-4.5 text-slate-600" />
        </div>
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">Platform Settings</h1>
          <p className="text-sm text-slate-500 font-normal mt-0.5">Configure rules, thresholds, and feature flags</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1 w-fit">
        <a href="?tab=settings" className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${tab === "settings" ? "bg-slate-800 text-white" : "text-slate-500 hover:text-slate-800"}`}>
          Settings
        </a>
        <a href="?tab=flags" className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${tab === "flags" ? "bg-slate-800 text-white" : "text-slate-500 hover:text-slate-800"}`}>
          Feature Flags
        </a>
      </div>

      {/* Content */}
      <Suspense fallback={<div className="p-8 text-center"><Loader2 className="w-5 h-5 animate-spin text-orange-400 mx-auto" /></div>}>
        {tab === "settings" && <PlatformSettings />}
        {tab === "flags" && <FeatureFlags />}
      </Suspense>
    </div>
  );
}
