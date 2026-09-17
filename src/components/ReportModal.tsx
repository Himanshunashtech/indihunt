"use client";

import React, { useState } from "react";
import { X, Loader2, CheckCircle2, AlertCircle, ShieldAlert } from "lucide-react";
import { reportComment, reportThread, reportProduct, checkContentViolation } from "@/lib/supabase";

export interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetId: string;
  targetType: "thread" | "comment" | "product";
  userId?: string | null;
  title?: string;
  onSuccess?: () => void;
}

const REPORT_REASONS = [
  { id: "spam", label: "Spam" },
  { id: "duplicate", label: "Duplicate" },
  { id: "harmful", label: "Harmful" },
  { id: "not_working", label: "Not Working / Needs Editing" },
  { id: "self_promotion", label: "Self-promotion" },
  { id: "ai_generated", label: "Artificially generated (e.g. ChatGPT)" },
];

export function ReportModal({
  isOpen,
  onClose,
  targetId,
  targetType,
  userId,
  title,
  onSuccess
}: ReportModalProps) {
  const [selectedReason, setSelectedReason] = useState<string>("spam");
  const [description, setDescription] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submittedStatus, setSubmittedStatus] = useState<"idle" | "success" | "already_reported">("idle");

  if (!isOpen) return null;

  const defaultTitle = 
    title || 
    (targetType === "thread" 
      ? "Report Forum thread" 
      : targetType === "comment" 
      ? "Report Comment" 
      : "Report Product");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!userId) {
      setErrorMsg("You must be logged in to report content.");
      return;
    }

    // Moderation check on optional user text description
    if (description.trim()) {
      const violation = checkContentViolation(description);
      if (violation.hasViolation) {
        setErrorMsg(violation.message || "Your input violates community guidelines.");
        return;
      }
    }

    setIsSubmitting(true);

    try {
      let res: { success: boolean; alreadyReported?: boolean } = { success: false };

      if (targetType === "thread") {
        res = await reportThread(targetId, userId, selectedReason, description);
      } else if (targetType === "comment") {
        res = await reportComment(targetId, userId, selectedReason, description);
      } else if (targetType === "product") {
        res = await reportProduct(targetId, userId, selectedReason, description);
      } else {
        res = await reportComment(targetId, userId, selectedReason, description);
      }

      if (res.alreadyReported) {
        setSubmittedStatus("already_reported");
      } else if (res.success) {
        setSubmittedStatus("success");
        if (onSuccess) onSuccess();
      } else {
        setErrorMsg("Failed to submit report. Please try again.");
      }
    } catch (err) {
      console.error("Error submitting report:", err);
      setErrorMsg("An unexpected error occurred while submitting your report.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetAndClose = () => {
    setSelectedReason("spam");
    setDescription("");
    setErrorMsg(null);
    setSubmittedStatus("idle");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      {/* Modal Container */}
      <div 
        className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 rounded-3xl shadow-2xl p-6 sm:p-8 max-w-md w-full relative border border-zinc-100 dark:border-zinc-800 transform transition-all animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={handleResetAndClose}
          className="absolute top-5 right-5 p-2 rounded-full text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {submittedStatus === "idle" ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Header */}
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-white">
                {defaultTitle}
              </h2>
            </div>

            {/* Error banner */}
            {errorMsg && (
              <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 text-red-700 dark:text-red-300 text-xs sm:text-sm">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Radio Options */}
            <div className="space-y-3.5 pt-1">
              {REPORT_REASONS.map((reason) => {
                const isSelected = selectedReason === reason.id;
                return (
                  <label
                    key={reason.id}
                    onClick={() => setSelectedReason(reason.id)}
                    className="flex items-center gap-3.5 cursor-pointer group select-none"
                  >
                    <div className="relative flex items-center justify-center">
                      <input
                        type="radio"
                        name="reportReason"
                        value={reason.id}
                        checked={isSelected}
                        onChange={() => setSelectedReason(reason.id)}
                        className="sr-only"
                      />
                      <div
                        className={`w-5 h-5 rounded-full border transition-all flex items-center justify-center ${
                          isSelected
                            ? "border-rose-500 bg-white dark:bg-zinc-900"
                            : "border-zinc-300 dark:border-zinc-700 group-hover:border-zinc-400 dark:group-hover:border-zinc-500"
                        }`}
                      >
                        {isSelected && (
                          <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                        )}
                      </div>
                    </div>
                    <span
                      className={`text-sm sm:text-base transition-colors ${
                        isSelected
                          ? "font-normal text-zinc-900 dark:text-white"
                          : "text-zinc-600 dark:text-zinc-400 group-hover:text-zinc-800 dark:group-hover:text-zinc-200"
                      }`}
                    >
                      {reason.label}
                    </span>
                  </label>
                );
              })}
            </div>

            {/* Additional details input (optional) */}
            <div className="pt-2">
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Additional details or context (optional)..."
                rows={2}
                maxLength={300}
                className="w-full text-xs sm:text-sm p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all resize-none"
              />
            </div>

            {/* Submit Coral Pill Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-auto px-7 py-2.5 rounded-full bg-[#ff5252] hover:bg-rose-600 active:scale-95 text-white font-normal text-sm sm:text-base shadow-md shadow-rose-500/20 hover:shadow-rose-500/30 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <span>Submit</span>
                )}
              </button>
            </div>
          </form>
        ) : submittedStatus === "success" ? (
          /* Success confirmation screen */
          <div className="py-6 text-center space-y-4 animate-in fade-in duration-300">
            <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-semibold text-zinc-900 dark:text-white">
              Report Received
            </h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 max-w-xs mx-auto">
              Thank you for helping keep IndiHunt safe. Our moderation team will review this report shortly.
            </p>
            <div className="pt-4">
              <button
                onClick={handleResetAndClose}
                className="px-6 py-2 rounded-full bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-sm font-normal hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          /* Already reported screen */
          <div className="py-6 text-center space-y-4 animate-in fade-in duration-300">
            <div className="w-14 h-14 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-semibold text-zinc-900 dark:text-white">
              Already Reported
            </h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 max-w-xs mx-auto">
              You have already submitted a report for this item. Our team is working on it!
            </p>
            <div className="pt-4">
              <button
                onClick={handleResetAndClose}
                className="px-6 py-2 rounded-full bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-sm font-normal hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ReportModal;
