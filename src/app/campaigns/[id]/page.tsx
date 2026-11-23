"use client";


import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  TrendingUp,
  Megaphone,
  MousePointerClick,
  Eye,
  DollarSign,
  Percent,
  BarChart3,
  Calendar,
  Activity
} from "lucide-react";
import {
  supabase,
  getAdCampaignEvents,
  AdCampaign,
  AdEvent
} from "@/lib/supabase";

export default function CampaignAnalyticsPage() {
  const params = useParams();
  const router = useRouter();
  const campaignId = params.id as string;

  const [campaign, setCampaign] = useState<AdCampaign | null>(null);
  const [events, setEvents] = useState<AdEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"chart" | "raw">("chart");
  const [hoveredPoint, setHoveredPoint] = useState<{
    label: string;
    impressions: number;
    clicks: number;
    ctr: number;
    x: number;
    yImp: number;
    yClk: number;
  } | null>(null);

  useEffect(() => {
    async function loadCampaignData() {
      if (!campaignId) return;
      setLoading(true);

      try {
        // 1. Fetch Campaign Details
        let foundCamp: AdCampaign | null = null;
        if (supabase) {
          const { data } = await supabase
            .from("ad_campaigns")
            .select("*")
            .eq("id", campaignId)
            .single();
          if (data) foundCamp = data;
        }

        if (!foundCamp && typeof window !== "undefined") {
          const cached = localStorage.getItem("indihunt_ad_campaigns") || "[]";
          const list: AdCampaign[] = JSON.parse(cached);
          foundCamp = list.find(c => c.id === campaignId) || null;
        }

        if (!foundCamp) {
          alert("Campaign not found");
          router.push("/");
          return;
        }
        setCampaign(foundCamp);

        // 2. Fetch Campaign Events (Impressions & Clicks)
        const eventLogs = await getAdCampaignEvents(campaignId);
        setEvents(eventLogs);
      } catch (err) {
        console.error("Error loading campaign analytics:", err);
      } finally {
        setLoading(false);
      }
    }

    loadCampaignData();
  }, [campaignId, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <div className="w-10 h-10 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin" />
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest animate-pulse">Loading Analytics Pool...</span>
      </div>
    );
  }

  if (!campaign) return null;

  // Process events data into hourly intervals for the chart
  const processedChartData = () => {
    if (events.length === 0) {
      // Fallback seed inside chart if events array is empty
      return [
        { label: "00:00", impressions: 10, clicks: 0 },
        { label: "04:00", impressions: 30, clicks: 1 },
        { label: "08:00", impressions: 75, clicks: 3 },
        { label: "12:00", impressions: 140, clicks: 8 },
        { label: "16:00", impressions: 120, clicks: 6 },
        { label: "20:00", impressions: 90, clicks: 4 },
        { label: "Now", impressions: 45, clicks: 2 },
      ];
    }

    // Group events by hour of creation
    const groups: { [key: string]: { impressions: number; clicks: number } } = {};

    // Initialize last 7 time groups (e.g. 4-hour slots)
    const now = Date.now();
    const intervals = 7;
    const intervalMs = 4 * 60 * 60 * 1000; // 4 hours

    for (let i = 0; i < intervals; i++) {
      const time = new Date(now - (intervals - 1 - i) * intervalMs);
      const label = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
      groups[label] = { impressions: 0, clicks: 0 };
    }

    events.forEach(ev => {
      const evTime = new Date(ev.created_at).getTime();
      // Find matching interval
      let matchedLabel = Object.keys(groups)[0];
      let minDiff = Infinity;

      Object.keys(groups).forEach(label => {
        const [h, m] = label.split(":").map(Number);
        const refTime = new Date();
        refTime.setHours(h, m, 0, 0);

        const diff = Math.abs(evTime - refTime.getTime());
        if (diff < minDiff) {
          minDiff = diff;
          matchedLabel = label;
        }
      });

      if (ev.event_type === "impression") {
        groups[matchedLabel].impressions++;
      } else {
        groups[matchedLabel].clicks++;
      }
    });

    return Object.entries(groups).map(([label, val]) => ({
      label,
      impressions: val.impressions,
      clicks: val.clicks
    }));
  };

  const chartPoints = processedChartData();
  const maxImpressions = Math.max(...chartPoints.map(p => p.impressions), 10);
  const maxClicks = Math.max(...chartPoints.map(p => p.clicks), 1);

  // SVG dimensions
  const svgWidth = 600;
  const svgHeight = 220;
  const paddingX = 40;
  const paddingY = 20;
  const graphWidth = svgWidth - paddingX * 2;
  const graphHeight = svgHeight - paddingY * 2;

  // Build SVG Path helper
  const getSvgCoordinates = (type: "impression" | "click") => {
    return chartPoints.map((p, idx) => {
      const x = paddingX + (idx / (chartPoints.length - 1)) * graphWidth;
      const val = type === "impression" ? p.impressions : p.clicks;
      const max = type === "impression" ? maxImpressions : maxClicks;
      const y = paddingY + graphHeight - (val / max) * graphHeight;
      return { x, y, point: p };
    });
  };

  const impCoords = getSvgCoordinates("impression");
  const clickCoords = getSvgCoordinates("click");

  const buildPathString = (coords: { x: number; y: number }[]) => {
    if (coords.length === 0) return "";
    return `M ${coords[0].x} ${coords[0].y} ` + coords.slice(1).map(c => `L ${c.x} ${c.y}`).join(" ");
  };

  const buildAreaPathString = (coords: { x: number; y: number }[]) => {
    if (coords.length === 0) return "";
    const first = coords[0];
    const last = coords[coords.length - 1];
    const baseLineY = paddingY + graphHeight;
    return `${buildPathString(coords)} L ${last.x} ${baseLineY} L ${first.x} ${baseLineY} Z`;
  };

  const ctr = campaign.impressions > 0
    ? ((campaign.clicks / campaign.impressions) * 100).toFixed(2)
    : "0.00";

  return (
    <div className="min-h-screen bg-background text-foreground py-10 px-4">
      <div className="max-w-4xl mx-auto space-y-8">

        {/* Back Link */}
        <Link
          href={`/my-products/${campaign.product_id}/settings`}
          className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Product Settings</span>
        </Link>

        {/* Header Block */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 ">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md bg-orange-500/10 text-orange-500 border border-orange-500/15 text-[10px] font-semibold uppercase tracking-wider">
                {campaign.status}
              </span>
              <span className="text-[10px] text-muted-foreground font-mono">Campaign ID: {campaign.id}</span>
            </div>
            <h1 className="text-xl font-extrabold mt-2 text-foreground flex items-center gap-2">
              <span>Performance Analytics: {campaign.name}</span>
            </h1>
            <p className="text-xs text-muted-foreground mt-1">Real-time engagement telemetry showing CTR, conversion efficiency, and daily CPC metrics.</p>
          </div>

          <div className="bg-muted/10 border border-border/80 px-4 py-2.5 rounded-2xl flex items-center gap-2">
            <Calendar className="w-4 h-4 text-orange-500" />
            <span className="text-[11px] font-semibold text-foreground">Last 24 Hours</span>
          </div>
        </div>

        {/* KPI Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">

          <div className="bg-card border border-border p-4.5 rounded-3xl space-y-2.5 shadow-sm relative overflow-hidden group hover:border-orange-500/20 transition-all duration-300">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest block">Impressions</span>
              <Eye className="w-4 h-4 text-muted-foreground/60" />
            </div>
            <div>
              <span className="text-xl font-extrabold text-foreground block">{campaign.impressions.toLocaleString()}</span>
              <span className="text-[10px] text-muted-foreground block mt-1">Total page view placements</span>
            </div>
          </div>

          <div className="bg-card border border-border p-4.5 rounded-3xl space-y-2.5 shadow-sm relative overflow-hidden group hover:border-orange-500/20 transition-all duration-300">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest block">Clicks</span>
              <MousePointerClick className="w-4 h-4 text-orange-500" />
            </div>
            <div>
              <span className="text-xl font-extrabold text-foreground block">{campaign.clicks.toLocaleString()}</span>
              <span className="text-[10px] text-muted-foreground block mt-1">Direct click-through count</span>
            </div>
          </div>

          <div className="bg-card border border-border p-4.5 rounded-3xl space-y-2.5 shadow-sm relative overflow-hidden group hover:border-orange-500/20 transition-all duration-300">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest block">Click-Through Rate</span>
              <Percent className="w-4 h-4 text-muted-foreground/60" />
            </div>
            <div>
              <span className="text-xl font-extrabold text-orange-500 block">{ctr}%</span>
              <span className="text-[10px] text-muted-foreground block mt-1">Click to placement conversion</span>
            </div>
          </div>

          <div className="bg-card border border-border p-4.5 rounded-3xl space-y-2.5 shadow-sm relative overflow-hidden group hover:border-orange-500/20 transition-all duration-300">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest block">Delivery Exhaustion</span>
              <Megaphone className="w-4 h-4 text-muted-foreground/60" />
            </div>
            <div>
              <span className="text-xl font-extrabold text-foreground block">{campaign.delivered_impressions?.toLocaleString() || 0}</span>
              <span className="text-[10px] text-muted-foreground block mt-1">of {campaign.target_impressions?.toLocaleString() || 0} target</span>
            </div>
          </div>

        </div>

        {/* Dashboard Tabs & Chart Wrapper */}
        <div className="bg-card border border-border rounded-3xl p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between  pb-4">
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab("chart")}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${activeTab === "chart"
                    ? "bg-[#ff5733] text-white"
                    : "bg-muted/10 text-muted-foreground hover:bg-muted/20"
                  }`}
              >
                Telemetry Line Chart
              </button>
              <button
                onClick={() => setActiveTab("raw")}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${activeTab === "raw"
                    ? "bg-[#ff5733] text-white"
                    : "bg-muted/10 text-muted-foreground hover:bg-muted/20"
                  }`}
              >
                Raw Activity Log ({events.length})
              </button>
            </div>

            <div className="flex items-center gap-1 text-[10px] font-semibold text-muted-foreground">
              <Activity className="w-3.5 h-3.5 text-orange-500" />
              <span>LIVE EVENTS PIPELINE</span>
            </div>
          </div>

          {activeTab === "chart" ? (
            <div className="space-y-6">

              {/* Responsive SVG Chart with interactive coordinates */}
              <div className="relative border border-border/60 bg-muted/5 rounded-2xl p-4 flex items-center justify-center">

                {/* Overlay Point Tooltip */}
                {hoveredPoint && (
                  <div
                    style={{ left: hoveredPoint.x - 60, top: hoveredPoint.yImp - 65 }}
                    className="absolute bg-foreground text-background text-[10px] font-semibold p-2 rounded-xl shadow-lg border border-border flex flex-col pointer-events-none z-10 w-[120px]"
                  >
                    <span className=" pb-1 mb-1 block font-bold text-center">{hoveredPoint.label}</span>
                    <span className="flex justify-between"><span>Views:</span> <span>{hoveredPoint.impressions}</span></span>
                    <span className="flex justify-between"><span>Clicks:</span> <span>{hoveredPoint.clicks}</span></span>
                    <span className="flex justify-between text-orange-500"><span>CTR:</span> <span>{hoveredPoint.ctr}%</span></span>
                  </div>
                )}

                <svg
                  viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                  className="w-full h-auto select-none"
                >
                  {/* Grid Lines */}
                  {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
                    const y = paddingY + ratio * graphHeight;
                    return (
                      <line
                        key={idx}
                        x1={paddingX}
                        y1={y}
                        x2={svgWidth - paddingX}
                        y2={y}
                        className="stroke-border/40 stroke-1"
                        strokeDasharray="4 4"
                      />
                    );
                  })}

                  {/* Area fill for Impressions (Base layer) */}
                  <path
                    d={buildAreaPathString(impCoords)}
                    fill="rgba(255, 87, 51, 0.05)"
                    className="transition-all duration-500"
                  />

                  {/* Line path for Impressions */}
                  <path
                    d={buildPathString(impCoords)}
                    fill="none"
                    className="stroke-[#ff5733]/30 stroke-2 transition-all duration-500"
                  />

                  {/* Line path for Clicks (Emphasized layer) */}
                  <path
                    d={buildPathString(clickCoords)}
                    fill="none"
                    className="stroke-[#ff5733] stroke-2.5 transition-all duration-500"
                  />

                  {/* Coordinate interaction hotzones */}
                  {impCoords.map((coord, idx) => {
                    const clkCoord = clickCoords[idx];
                    const p = coord.point;
                    const pointCtr = p.impressions > 0 ? ((p.clicks / p.impressions) * 100).toFixed(2) : "0.00";
                    return (
                      <g key={idx}>
                        {/* Hover trigger circle */}
                        <circle
                          cx={coord.x}
                          cy={coord.y}
                          r={hoveredPoint?.label === p.label ? 6 : 3.5}
                          className="fill-background stroke-[#ff5733]/40 stroke-2 transition-all cursor-pointer"
                        />
                        <circle
                          cx={clkCoord.x}
                          cy={clkCoord.y}
                          r={hoveredPoint?.label === p.label ? 7 : 4.5}
                          className="fill-[#ff5733] stroke-background stroke-2 transition-all cursor-pointer"
                        />
                        {/* Invisible large hover triggers */}
                        <rect
                          x={coord.x - 20}
                          y={paddingY}
                          width={40}
                          height={graphHeight}
                          fill="transparent"
                          className="cursor-pointer"
                          onMouseEnter={() => setHoveredPoint({
                            label: p.label,
                            impressions: p.impressions,
                            clicks: p.clicks,
                            ctr: Number(pointCtr),
                            x: coord.x,
                            yImp: coord.y,
                            yClk: clkCoord.y
                          })}
                          onMouseLeave={() => setHoveredPoint(null)}
                        />
                      </g>
                    );
                  })}

                  {/* X Axis Labels */}
                  {chartPoints.map((p, idx) => {
                    const x = paddingX + (idx / (chartPoints.length - 1)) * graphWidth;
                    return (
                      <text
                        key={idx}
                        x={x}
                        y={svgHeight - 2}
                        textAnchor="middle"
                        className="fill-muted-foreground text-[8px] font-semibold font-mono"
                      >
                        {p.label}
                      </text>
                    );
                  })}
                </svg>

              </div>

              {/* Chart Legend */}
              <div className="flex items-center justify-center gap-6 text-[10px] font-semibold">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 bg-[#ff5733]/20 rounded-sm" />
                  <span className="text-muted-foreground">Views / Placements Plotted</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 bg-[#ff5733] rounded-sm" />
                  <span className="text-muted-foreground">Click Conversions Plotted</span>
                </div>
              </div>

            </div>
          ) : (
            <div className="space-y-4">
              <div className="overflow-x-auto border border-border/80 rounded-2xl">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-muted/10  text-[10px] font-extrabold uppercase text-muted-foreground tracking-wider">
                      <th className="px-5 py-3">Event ID</th>
                      <th className="px-5 py-3">Event Type</th>
                      <th className="px-5 py-3">Source Placement</th>
                      <th className="px-5 py-3 text-right">Logged Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {events.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-5 py-8 text-center text-muted-foreground font-medium">No raw logs registered yet. Trigger placements on the site to register.</td>
                      </tr>
                    ) : (
                      events.map(ev => (
                        <tr key={ev.id} className="hover:bg-muted/5 font-medium text-foreground">
                          <td className="px-5 py-3.5 font-mono text-[10px] text-muted-foreground">#{ev.id.substring(0, 10)}</td>
                          <td className="px-5 py-3.5">
                            <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-semibold uppercase ${ev.event_type === "click"
                                ? "bg-orange-500/10 text-orange-500 border border-orange-500/15"
                                : "bg-muted text-muted-foreground border border-border"
                              }`}>
                              {ev.event_type}
                            </span>
                          </td>
                          <td className="px-5 py-3.5">product_pages</td>
                          <td className="px-5 py-3.5 text-right font-mono text-[10px] text-muted-foreground">{new Date(ev.created_at).toLocaleString()}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
