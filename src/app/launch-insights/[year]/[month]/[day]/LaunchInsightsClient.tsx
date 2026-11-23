"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import {
  ArrowLeft,
  Sparkles,
  MessageSquare,
  Check,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Pin
} from "lucide-react";
import { Product, Comment, LaunchInsightsData } from "@/lib/supabase";

const VIBRANT_PALETTE = [
  "#ec4899",
  "#10b981",
  "#3b82f6",
  "#f97316",
  "#8b5cf6",
  "#06b6d4",
  "#eab308",
  "#a855f7",
  "#84cc16",
  "#ef4444",
  "#14b8a6",
  "#6366f1",
  "#f43f5e",
  "#059669",
  "#d97706",
  "#4f46e5",
];

interface LaunchInsightsClientProps {
  year: string;
  month: string;
  day: string;
  displayDateText: string;
  initialData: LaunchInsightsData;
}

export default function LaunchInsightsClient({
  year,
  month,
  day,
  displayDateText,
  initialData,
}: LaunchInsightsClientProps) {
  const router = useRouter();
  const [data] = useState<LaunchInsightsData>(initialData);

  // Initialize checkboxes for top 5
  const [pointsChecked, setPointsChecked] = useState<Record<string, boolean>>(() => {
    const map: Record<string, boolean> = {};
    initialData.products.slice(0, 20).forEach((p, idx) => {
      map[p.name] = idx < 5;
    });
    return map;
  });

  const [commentsChecked, setCommentsChecked] = useState<Record<string, boolean>>(() => {
    const map: Record<string, boolean> = {};
    initialData.products.slice(0, 20).forEach((p, idx) => {
      map[p.name] = idx < 5;
    });
    return map;
  });

  // Tooltip hover states
  const [pointsHoverIndex, setPointsHoverIndex] = useState<number | null>(null);
  const [commentsHoverIndex, setCommentsHoverIndex] = useState<number | null>(null);
  const [pointsHoverPos, setPointsHoverPos] = useState({ x: 0, y: 0 });
  const [commentsHoverPos, setCommentsHoverPos] = useState({ x: 0, y: 0 });

  const pointsChartRef = useRef<HTMLDivElement>(null);
  const commentsChartRef = useRef<HTMLDivElement>(null);

  const getProductColor = (productName: string, index?: number): string => {
    if (typeof index === "number" && index >= 0) {
      return VIBRANT_PALETTE[index % VIBRANT_PALETTE.length];
    }
    let hash = 0;
    for (let i = 0; i < productName.length; i++) {
      hash = productName.charCodeAt(i) + ((hash << 5) - hash);
    }
    return VIBRANT_PALETTE[Math.abs(hash) % VIBRANT_PALETTE.length];
  };

  const handleDateChange = (direction: "prev" | "next") => {
    const curr = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    if (direction === "prev") {
      curr.setDate(curr.getDate() - 1);
    } else {
      curr.setDate(curr.getDate() + 1);
    }
    router.push(`/launch-insights/${curr.getFullYear()}/${curr.getMonth() + 1}/${curr.getDate()}`);
  };

  // SVG Line Chart renderer
  const renderSVGChart = (
    timeline: any[],
    checkedMap: Record<string, boolean>,
    maxVal: number,
    ticks: number[],
    hoverIndex: number | null,
    setHoverIndex: (i: number | null) => void,
    setHoverPos: (pos: { x: number; y: number }) => void,
    chartRef: React.RefObject<HTMLDivElement | null>
  ) => {
    const width = 850;
    const height = 400;
    const paddingLeft = 60;
    const paddingRight = 40;
    const paddingTop = 40;
    const paddingBottom = 40;

    const chartWidth = width - paddingLeft - paddingRight;
    const chartHeight = height - paddingTop - paddingBottom;
    const numPoints = timeline.length;

    const gridLines = 5;

    const getCoords = (val: number, index: number) => {
      const x = paddingLeft + (index / (numPoints - 1)) * chartWidth;
      const y = height - paddingBottom - (val / maxVal) * chartHeight;
      return { x, y };
    };

    const handleMouseMove = (e: React.MouseEvent<SVGSVGElement, MouseEvent>) => {
      if (!chartRef.current) return;
      const rect = chartRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left - paddingLeft;
      const progress = mouseX / (rect.width - paddingLeft - paddingRight);
      const rawIdx = progress * (numPoints - 1);
      const idx = Math.max(0, Math.min(numPoints - 1, Math.round(rawIdx)));

      setHoverIndex(idx);
      setHoverPos({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    };

    return (
      <div className="relative w-full overflow-x-auto" ref={chartRef}>
        <svg
          width="100%"
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          className="overflow-visible select-none"
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoverIndex(null)}
        >
          {ticks.map((val) => {
            const y = height - paddingBottom - (val / Math.max(maxVal, 1)) * chartHeight;

            return (
              <g key={val}>
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={width - paddingRight}
                  y2={y}
                  stroke="var(--color-border)"
                  strokeDasharray="4 4"
                  strokeOpacity={0.6}
                />
                <text
                  x={paddingLeft - 12}
                  y={y + 4}
                  fill="var(--color-muted-foreground)"
                  fontSize="11"
                  fontWeight="600"
                  textAnchor="end"
                >
                  {val}
                </text>
              </g>
            );
          })}

          {timeline.map((t, idx) => {
            if (idx % 4 !== 0 && idx !== numPoints - 1) return null;
            const x = paddingLeft + (idx / (numPoints - 1)) * chartWidth;
            return (
              <text
                key={idx}
                x={x}
                y={height - 10}
                fill="var(--color-muted-foreground)"
                fontSize="11"
                fontWeight="500"
                textAnchor="middle"
              >
                {t.time}
              </text>
            );
          })}

          {data.products
            .filter(p => checkedMap[p.name])
            .map(p => {
              const pIdx = data.products.findIndex(prod => prod.id === p.id || prod.name === p.name);
              const color = getProductColor(p.name, pIdx >= 0 ? pIdx : 0);
              const points = timeline.map((t, idx) => getCoords(t[p.name] || 0, idx));
              const pathData = points
                .map((pt, idx) => `${idx === 0 ? "M" : "L"} ${pt.x} ${pt.y}`)
                .join(" ");

              return (
                <g key={p.name}>
                  <path
                    d={pathData}
                    fill="none"
                    stroke={color}
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="transition-all duration-150"
                  />
                  {points.map((pt, idx) => (
                    <circle
                      key={idx}
                      cx={pt.x}
                      cy={pt.y}
                      r={hoverIndex === idx ? 6 : 3.5}
                      fill={color}
                      stroke="var(--color-card)"
                      strokeWidth="2"
                      className="transition-all"
                    />
                  ))}
                </g>
              );
            })}
        </svg>
      </div>
    );
  };

  const renderSparkline = (points: number[], color: string) => {
    const width = 120;
    const height = 40;
    const maxVal = Math.max(...points, 1);
    const minVal = Math.min(...points, 0);
    const range = maxVal - minVal || 1;

    const pathData = points
      .map((val, idx) => {
        const x = (idx / (points.length - 1)) * width;
        const y = height - ((val - minVal) / range) * (height - 8) - 4;
        return `${idx === 0 ? "M" : "L"} ${x} ${y}`;
      })
      .join(" ");

    return (
      <svg width={width} height={height} className="overflow-visible">
        <path
          d={pathData}
          fill="none"
          stroke={color}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  };

  // Upvotes ticks with difference of 5: 0, 5, 10, 15, 20, 25...
  const maxUpvoteInData = Math.max(
    ...data.products.map((p) => p.upvotes_count || 0),
    ...(data.pointsTimeline || []).flatMap((t) => data.products.map((p) => t[p.name] || 0)),
    20
  );
  const upvotesMaxVal = Math.max(25, Math.ceil(maxUpvoteInData / 5) * 5);
  const upvotesTicks: number[] = [];
  for (let v = 0; v <= upvotesMaxVal; v += 5) {
    upvotesTicks.push(v);
  }

  // Comments ticks: 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 (step of 1)
  const maxCommentInData = Math.max(
    ...data.products.map((p) => p.comments_count || 0),
    ...(data.commentsTimeline || []).flatMap((t) => data.products.map((p) => t[p.name] || 0)),
    10
  );
  const commentsMaxVal = Math.max(10, Math.ceil(maxCommentInData));
  const commentsTicks: number[] = [];
  if (commentsMaxVal <= 10) {
    for (let v = 0; v <= 10; v++) {
      commentsTicks.push(v);
    }
  } else {
    const cStep = commentsMaxVal <= 15 ? 1 : Math.ceil(commentsMaxVal / 10);
    for (let v = 0; v <= commentsMaxVal; v += cStep) {
      commentsTicks.push(v);
    }
    if (!commentsTicks.includes(commentsMaxVal)) {
      commentsTicks.push(commentsMaxVal);
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-orange-500 selection:text-white pt-[60px] sm:pt-[72px]">
      <Navbar searchQuery="" onSearchChange={() => { }} />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-8">
        {/* Top Header Row with Navigation */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-5">
          <div className="space-y-1">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-orange-500 transition-colors mb-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Launches</span>
            </Link>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2.5">
              <Sparkles className="w-6 h-6 text-orange-500" />
              Launch Insights
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground font-medium">
              Daily leaderboard analytics, vote trajectories, and engagement breakdown for {displayDateText}
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center">
            <button
              onClick={() => handleDateChange("prev")}
              className="p-2 rounded-xl border border-border bg-card hover:bg-muted text-foreground transition-all cursor-pointer shadow-xs"
              title="Previous Day"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-border bg-card text-xs font-semibold text-foreground shadow-xs">
              <Calendar className="w-3.5 h-3.5 text-orange-500" />
              <span>{displayDateText}</span>
            </div>
            <button
              onClick={() => handleDateChange("next")}
              className="p-2 rounded-xl border border-border bg-card hover:bg-muted text-foreground transition-all cursor-pointer shadow-xs"
              title="Next Day"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 1. UPVOTES CHART & TOP 20 PRODUCT LIST */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-extrabold text-foreground">Upvotes Growth</h2>
            <span className="text-xs font-medium text-muted-foreground">(Top 20 Products)</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Chart Area */}
            <div className="lg:col-span-9 bg-card border border-border p-6 rounded-3xl relative">
              {renderSVGChart(
                data.pointsTimeline,
                pointsChecked,
                upvotesMaxVal,
                upvotesTicks,
                pointsHoverIndex,
                setPointsHoverIndex,
                setPointsHoverPos,
                pointsChartRef
              )}

              {/* Real-time Hover Tooltip */}
              {pointsHoverIndex !== null && (
                <div
                  className="absolute bg-card border border-border p-3.5 rounded-2xl shadow-xl z-30 min-w-[160px] space-y-1.5 text-left select-none pointer-events-none"
                  style={{
                    left: `${pointsHoverPos.x + 10}px`,
                    top: `${pointsHoverPos.y + 10}px`
                  }}
                >
                  <span className="text-[10px] font-semibold text-muted-foreground block pb-1 mb-1">
                    {data.pointsTimeline[pointsHoverIndex]?.time}
                  </span>
                  {data.products
                    .filter(p => pointsChecked[p.name])
                    .map(p => {
                      const pIdx = data.products.findIndex(prod => prod.id === p.id);
                      const color = getProductColor(p.name, pIdx >= 0 ? pIdx : 0);
                      return (
                        <div key={p.name} className="flex items-center justify-between gap-4 text-xs font-medium">
                          <span className="flex items-center gap-1.5">
                            <span
                              className="w-2.5 h-2.5 rounded-full shrink-0"
                              style={{ backgroundColor: color }}
                            />
                            <span className="truncate max-w-[100px]">{p.name}</span>
                          </span>
                          <span style={{ color }}>{data.pointsTimeline[pointsHoverIndex]?.[p.name] || 0} votes</span>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>

            {/* Checklist Sidebar */}
            <div className="lg:col-span-3 bg-card border border-border p-5 rounded-3xl space-y-4">
              <div className="flex items-center justify-between pb-1.5 border-b border-border/40">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground block">
                  Top Launches
                </span>
                <span className="text-[10px] font-semibold text-orange-500">
                  {Object.values(pointsChecked).filter(Boolean).length}/20 Selected
                </span>
              </div>
              <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                {data.products.slice(0, 20).map((p, idx) => {
                  const color = getProductColor(p.name, idx);
                  const isChecked = pointsChecked[p.name];
                  return (
                    <button
                      key={p.id}
                      onClick={() => setPointsChecked(prev => ({ ...prev, [p.name]: !prev[p.name] }))}
                      className="w-full flex items-center justify-between p-1.5 px-3 rounded-full border border-border hover:bg-muted/20 transition-all text-left cursor-pointer font-medium"
                    >
                      <div className="flex items-center gap-2 max-w-[170px]">
                        <span className="text-[10px] text-muted-foreground w-4 font-mono">{idx + 1}</span>
                        <div className="w-5 h-5 rounded-full overflow-hidden relative flex-shrink-0 border border-border/50 bg-muted flex items-center justify-center">
                          {p.logo_url ? (
                            <Image src={p.logo_url} alt="" className="object-cover w-full h-full" width={48} height={48} />
                          ) : (
                            <span className="text-[9px] font-semibold" style={{ color }}>{p.name.charAt(0)}</span>
                          )}
                        </div>
                        <span className="text-xs truncate" style={{ color: isChecked ? color : "inherit", fontWeight: isChecked ? "bold" : "normal" }}>{p.name}</span>
                      </div>
                      <div className="flex items-center">
                        <div
                          className="w-4 h-4 rounded-md border flex items-center justify-center transition-all text-white"
                          style={{
                            backgroundColor: isChecked ? color : "transparent",
                            borderColor: isChecked ? color : "var(--color-border)"
                          }}
                        >
                          {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* 2. COMMENTS GROWTH CHART */}
        <div className="space-y-4 pt-4">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-extrabold text-foreground">Comments Growth</h2>
            <span className="text-xs font-medium text-muted-foreground">(Top 20 Products)</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-9 bg-card border border-border p-6 rounded-3xl relative">
              {renderSVGChart(
                data.commentsTimeline,
                commentsChecked,
                commentsMaxVal,
                commentsTicks,
                commentsHoverIndex,
                setCommentsHoverIndex,
                setCommentsHoverPos,
                commentsChartRef
              )}

              {commentsHoverIndex !== null && (
                <div
                  className="absolute bg-card border border-border p-3.5 rounded-2xl shadow-xl z-30 min-w-[160px] space-y-1.5 text-left select-none pointer-events-none"
                  style={{
                    left: `${commentsHoverPos.x + 10}px`,
                    top: `${commentsHoverPos.y + 10}px`
                  }}
                >
                  <span className="text-[10px] font-semibold text-muted-foreground block pb-1 mb-1">
                    {data.commentsTimeline[commentsHoverIndex]?.time}
                  </span>
                  {data.products
                    .filter(p => commentsChecked[p.name])
                    .map(p => {
                      const pIdx = data.products.findIndex(prod => prod.id === p.id);
                      const color = getProductColor(p.name, pIdx >= 0 ? pIdx : 0);
                      return (
                        <div key={p.name} className="flex items-center justify-between gap-4 text-xs font-medium">
                          <span className="flex items-center gap-1.5">
                            <span
                              className="w-2.5 h-2.5 rounded-full shrink-0"
                              style={{ backgroundColor: color }}
                            />
                            <span className="truncate max-w-[100px]">{p.name}</span>
                          </span>
                          <span style={{ color }}>{data.commentsTimeline[commentsHoverIndex]?.[p.name] || 0} comments</span>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>

            <div className="lg:col-span-3 bg-card border border-border p-5 rounded-3xl space-y-4">
              <div className="flex items-center justify-between pb-1.5 border-b border-border/40">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground block">
                  Comments Count
                </span>
                <span className="text-[10px] font-semibold text-orange-500">
                  {Object.values(commentsChecked).filter(Boolean).length}/20 Selected
                </span>
              </div>
              <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                {data.products.slice(0, 20).map((p, idx) => {
                  const color = getProductColor(p.name, idx);
                  const isChecked = commentsChecked[p.name];
                  return (
                    <button
                      key={p.id}
                      onClick={() => setCommentsChecked(prev => ({ ...prev, [p.name]: !prev[p.name] }))}
                      className="w-full flex items-center justify-between p-1.5 px-3 rounded-full border border-border hover:bg-muted/20 transition-all text-left cursor-pointer font-medium"
                    >
                      <div className="flex items-center gap-2 max-w-[170px]">
                        <div className="flex items-center gap-0.5 text-[10px] text-muted-foreground w-7 flex-shrink-0">
                          <span>{p.comments_count || 0}</span>
                          <MessageSquare className="w-3 h-3 opacity-60" />
                        </div>
                        <div className="w-5 h-5 rounded-full overflow-hidden relative flex-shrink-0 border border-border/50 bg-muted flex items-center justify-center">
                          {p.logo_url ? (
                            <Image src={p.logo_url} alt="" className="object-cover w-full h-full" width={48} height={48} />
                          ) : (
                            <span className="text-[9px] font-semibold" style={{ color }}>{p.name.charAt(0)}</span>
                          )}
                        </div>
                        <span className="text-xs truncate" style={{ color: isChecked ? color : "inherit", fontWeight: isChecked ? "bold" : "normal" }}>{p.name}</span>
                      </div>
                      <div className="flex items-center">
                        <div
                          className="w-4 h-4 rounded-md border flex items-center justify-center transition-all text-white"
                          style={{
                            backgroundColor: isChecked ? color : "transparent",
                            borderColor: isChecked ? color : "var(--color-border)"
                          }}
                        >
                          {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* 3. METRIC CARDS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-card border border-border p-6 rounded-3xl flex flex-col justify-between h-[180px] shadow-xs">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">Most points</span>
                <span className="text-3xl font-extrabold block mt-2">{data.mostPoints.points}</span>
              </div>
              <div className="flex items-center gap-1.5 bg-muted px-2.5 py-1 rounded-lg border border-border">
                <div className="w-4 h-4 rounded-md overflow-hidden relative border border-border/50">
                  <Image src={data.mostPoints.product.logo_url} alt="" className="object-cover w-full h-full" width={48} height={48} />
                </div>
                <span className="text-[10px] font-semibold">{data.mostPoints.product.name}</span>
              </div>
            </div>
            <div className="pt-4 flex justify-end">
              {renderSparkline(data.mostPoints.sparkline, getProductColor(data.mostPoints.product.name, 0))}
            </div>
          </div>

          <div className="bg-card border border-border p-6 rounded-3xl flex flex-col justify-between h-[180px] shadow-xs">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">Most comments</span>
                <span className="text-3xl font-extrabold block mt-2">{data.mostComments.comments}</span>
              </div>
              <div className="flex items-center gap-1.5 bg-muted px-2.5 py-1 rounded-lg border border-border">
                <div className="w-4 h-4 rounded-md overflow-hidden relative border border-border/50">
                  <Image src={data.mostComments.product.logo_url} alt="" className="object-cover w-full h-full" width={48} height={48} />
                </div>
                <span className="text-[10px] font-semibold">{data.mostComments.product.name}</span>
              </div>
            </div>
            <div className="pt-4 flex justify-end">
              {renderSparkline(data.mostComments.sparkline, getProductColor(data.mostComments.product.name, 1))}
            </div>
          </div>

          <div className="bg-card border border-border p-6 rounded-3xl flex flex-col justify-between h-[180px] shadow-xs text-left">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">Most popular launch tag</span>
              <span className="text-2xl font-extrabold block mt-1.5 text-foreground">{data.mostPopularTag.name}</span>
              <span className="text-[10px] text-muted-foreground font-semibold mt-0.5 block">Used by {data.mostPopularTag.count} products</span>
            </div>
            <div className="flex flex-wrap gap-1.5 mt-4">
              {data.mostPopularTag.products.map(p => (
                <div key={p.id} className="flex items-center gap-1 bg-muted px-2 py-1 rounded-lg border border-border">
                  <div className="w-3.5 h-3.5 rounded-sm overflow-hidden flex-shrink-0">
                    <Image src={p.logo_url} alt="" className="w-full h-full object-cover" width={48} height={48} />
                  </div>
                  <span className="text-[9px] font-bold">{p.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 4. COMMENT WITH MOST VOTES CARD */}
        <div className="bg-card border border-border p-6 rounded-3xl shadow-xs text-left space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-border/40">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">Comment with most votes</span>
              <span className="text-2xl font-extrabold block mt-1">{data.topComment.votes || (data.topComment.comment as any)?.upvotes_count || 2} upvotes</span>
            </div>
            <div className="flex items-center gap-1.5 bg-muted px-3 py-1.5 rounded-xl border border-border">
              <div className="w-4 h-4 rounded overflow-hidden">
                <Image src={data.topComment.product.logo_url} alt="" className="w-full h-full object-cover" width={48} height={48} />
              </div>
              <span className="text-xs font-bold text-foreground">{data.topComment.product.name}</span>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full overflow-hidden border border-border bg-muted flex items-center justify-center">
                {data.topComment.user.avatar_url ? (
                  <Image src={data.topComment.user.avatar_url} alt="" className="w-full h-full object-cover" width={48} height={48} />
                ) : (
                  <span className="text-xs font-semibold text-orange-500">{data.topComment.user.full_name?.charAt(0) || "U"}</span>
                )}
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-foreground">{data.topComment.user.full_name}</span>
                  {data.topComment.user.is_maker && (
                    <span className="text-[9px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/15 px-1.5 py-0.5 rounded uppercase tracking-wider">
                      Maker
                    </span>
                  )}
                  <Pin className="w-3.5 h-3.5 text-orange-500 stroke-[2.5]" />
                </div>
                <span className="text-[10px] text-muted-foreground font-normal block">@{data.topComment.user.username}</span>
              </div>
            </div>

            <p className="text-xs text-foreground/90 leading-relaxed font-normal bg-muted/30 p-3.5 rounded-2xl border border-border/40">
              "{data.topComment.comment?.body || (data.topComment as any).body || ""}"
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
