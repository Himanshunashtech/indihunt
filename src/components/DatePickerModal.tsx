import React, { useState, useEffect } from "react";
import { getScheduledProductCounts } from "@/lib/supabase";

interface DatePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectDate: (date: Date) => void;
  currentSelectedDate?: Date;
}

export default function DatePickerModal({
  isOpen,
  onClose,
  onSelectDate,
  currentSelectedDate
}: DatePickerModalProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(currentSelectedDate);
  const [scheduledCounts, setScheduledCounts] = useState<Record<string, number>>({});
  const [, setLoadingCounts] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    let isMounted = true;
    setLoadingCounts(true);
    getScheduledProductCounts()
      .then((counts) => {
        if (isMounted) {
          setScheduledCounts(counts);
          setLoadingCounts(false);
        }
      })
      .catch((err) => {
        console.error("Failed to load scheduled product counts:", err);
        if (isMounted) setLoadingCounts(false);
      });
    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // Generate dates starting from tomorrow up to December 31 of the next calendar year
  const dates: Date[] = [];
  const start = new Date();
  start.setDate(start.getDate() + 1); // Start tomorrow
  const end = new Date(start.getFullYear() + 2, 11, 31); // December 31 of the year after next
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    dates.push(new Date(d));
  }

  const formatDay = (d: Date) => {
    return d.toLocaleDateString("en-US", { weekday: "short" });
  };

  const formatDate = (d: Date) => {
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "2-digit" });
  };

  const toDateKey = (d: Date) => {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  const isSameDay = (d1?: Date, d2?: Date) => {
    if (!d1 || !d2) return false;
    return (
      d1.getDate() === d2.getDate() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getFullYear() === d2.getFullYear()
    );
  };

  const handleScheduleClick = () => {
    if (selectedDate) {
      // Set to midnight PT or equivalent local midnight to match guidelines
      const scheduledDate = new Date(selectedDate);
      scheduledDate.setHours(0, 0, 0, 0);
      onSelectDate(scheduledDate);
    }
  };

  const selectedCount = selectedDate ? (scheduledCounts[toDateKey(selectedDate)] || 0) : 0;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-background/95 backdrop-blur-xl border border-border/40 rounded-2xl max-w-xl w-full p-6 space-y-6 shadow-xl relative animate-in zoom-in duration-200">
        <div>
          <h3 className="text-base font-semibold text-foreground mb-1">Schedule your launch</h3>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            You can schedule your launch in advance up to December of next year. Your product will be visible starting at midnight (PT) for the entire day. Don&apos;t worry, you&apos;re not locked in – you can change the date whenever you like.
          </p>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest block">Pick a launch date</span>
            <span className="text-[11px] text-muted-foreground">Shows live slots & scheduled count per day</span>
          </div>
          
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 max-h-64 overflow-y-auto pr-1 pb-1">
            {dates.map((d, idx) => {
              const selected = isSameDay(d, selectedDate);
              const dateKey = toDateKey(d);
              const count = scheduledCounts[dateKey] || 0;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedDate(d)}
                  className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5 ${
                    selected
                      ? "border-orange-500 bg-orange-500/10 text-orange-500 font-bold shadow-sm shadow-orange-500/5"
                      : "border-border hover:border-muted-foreground/30 bg-muted/20 text-foreground text-xs"
                  }`}
                >
                  <span className={`text-[11px] font-semibold uppercase tracking-wider ${selected ? "text-orange-500" : "text-muted-foreground"}`}>
                    {formatDay(d)}
                  </span>
                  <span className="text-xs font-semibold">
                    {formatDate(d)}
                  </span>
                  <span
                    className={`text-[10px] mt-0.5 px-1.5 py-0.5 rounded-md leading-tight ${
                      selected
                        ? "bg-orange-500/20 text-orange-600 dark:text-orange-400 font-bold"
                        : count > 0
                        ? "bg-orange-500/10 text-orange-600 dark:text-orange-400 font-semibold"
                        : "text-muted-foreground/60"
                    }`}
                  >
                    {count} {count === 1 ? "product" : "products"}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-2 pt-4 border-t border-border/40 justify-between">
          <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
            🚀 {selectedDate ? (
              <span>
                Selected: <strong className="text-foreground">{formatDay(selectedDate)} {formatDate(selectedDate)}</strong>
                {" · "}
                <span className={selectedCount > 0 ? "text-orange-500 font-semibold" : "text-muted-foreground"}>
                  {selectedCount} {selectedCount === 1 ? "product" : "products"} scheduled
                </span>
              </span>
            ) : (
              "Please select a date to schedule your launch."
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="bg-muted hover:bg-muted/80 text-foreground font-medium text-xs px-4 py-2 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!selectedDate}
              onClick={handleScheduleClick}
              className="bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-semibold text-xs px-4 py-2 rounded-xl transition-colors cursor-pointer"
            >
              Select a date
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

