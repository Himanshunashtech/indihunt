import React from "react";
import { Loader2 } from "lucide-react";

interface CircularLoaderProps {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  label?: string;
  center?: boolean;
}

export function CircularLoader({ size = "md", className = "", label, center = true }: CircularLoaderProps) {
  const sizeMap = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
    xl: "w-12 h-12",
  };

  const content = (
    <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
      <Loader2 className={`${sizeMap[size]} animate-spin text-orange-500`} />
      {label && <span className="text-sm font-medium text-muted-foreground">{label}</span>}
    </div>
  );

  if (center) {
    return <div className="w-full py-12 flex items-center justify-center">{content}</div>;
  }

  return content;
}

export default CircularLoader;
