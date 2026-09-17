import { LucideIcon, Loader2 } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  color?: "orange" | "blue" | "green" | "red" | "purple" | "amber";
  sub?: string;
}

const COLOR_MAP = {
  orange: {
    bg: "bg-orange-500/10",
    text: "text-orange-400",
    border: "border-orange-500/10",
    glow: "shadow-orange-500/10",
  },
  blue: {
    bg: "bg-blue-500/10",
    text: "text-blue-400",
    border: "border-blue-500/10",
    glow: "shadow-blue-500/10",
  },
  green: {
    bg: "bg-emerald-500/10",
    text: "text-emerald-400",
    border: "border-emerald-500/10",
    glow: "shadow-emerald-500/10",
  },
  red: {
    bg: "bg-red-500/10",
    text: "text-red-400",
    border: "border-red-500/10",
    glow: "shadow-red-500/10",
  },
  purple: {
    bg: "bg-purple-500/10",
    text: "text-purple-400",
    border: "border-purple-500/10",
    glow: "shadow-purple-500/10",
  },
  amber: {
    bg: "bg-amber-500/10",
    text: "text-amber-400",
    border: "border-amber-500/10",
    glow: "shadow-amber-500/10",
  },
};

export function StatCard({ label, value, icon: Icon, color = "orange", sub }: StatCardProps) {
  const c = COLOR_MAP[color];
  return (
    <div className={`bg-white border ${c.border} rounded-2xl p-5 flex items-start gap-4 shadow-lg ${c.glow}`}>
      <div className={`w-10 h-10 rounded-xl ${c.bg} flex items-center justify-center shrink-0`}>
        <Icon className={`w-5 h-5 ${c.text}`} />
      </div>
      <div className="min-w-0">
        <div className="text-2xl font-extrabold text-slate-900 tracking-tight">
          {typeof value === "number" ? value.toLocaleString() : value}
        </div>
        <div className="text-base text-slate-500 font-medium mt-0.5">{label}</div>
        {sub && <div className="text-sm text-slate-400 mt-1">{sub}</div>}
      </div>
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 flex items-center justify-center min-h-[96px]">
      <Loader2 className="w-6 h-6 animate-spin text-orange-400" />
    </div>
  );
}
