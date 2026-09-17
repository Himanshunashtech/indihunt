import React from "react";

interface SuccessScheduledModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SuccessScheduledModal({
  isOpen,
  onClose
}: SuccessScheduledModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-background/95 backdrop-blur-xl border border-border/40 rounded-2xl max-w-md w-full p-6 space-y-6 shadow-xl relative animate-in zoom-in duration-200">
        <div>
          <h3 className="text-lg font-bold text-foreground mb-1">Successfully Scheduled!</h3>
          <p className="text-xs text-muted-foreground">You can still edit your post and change the launch date.</p>
        </div>

        <div className="space-y-4">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest block font-semibold">Remember...</span>
          
          <div className="space-y-4 text-xs text-foreground/90 font-normal leading-relaxed">
            <div className="flex items-start gap-3">
              <span className="text-base select-none">💬</span>
              <p>Use our Launch Day dashboard to respond to questions and comments about your product throughout the day.</p>
            </div>
            
            <div className="flex items-start gap-3">
              <span className="text-base select-none">📣</span>
              <p>Share a link to your launch on social, email, and beyond. Don&apos;t explicitly ask for upvotes or spam with cold DMs and emails. Keep it genuine.</p>
            </div>
            
            <div className="flex items-start gap-3">
              <span className="text-base select-none">🚨</span>
              <p>Utilizing upvote services will result in your removal from the homepage. Sharing in promotion/upvote groups often results in low quality or spam activity that will negatively impact your launch performance. If your &quot;growth consultant&quot; is using prohibited tactics you will be held responsible.</p>
            </div>
          </div>
        </div>

        <div className="pt-2 border-t border-border/40">
          <button
            type="button"
            onClick={onClose}
            className="w-full bg-muted hover:bg-muted/80 text-foreground font-semibold text-xs py-2.5 rounded-xl transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
