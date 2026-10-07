"use client";

import React, { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";
import { getInitialTheme, applyTheme, Theme } from "@/lib/theme";

export interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

export default function ThemeToggle({ className = "", showLabel = false }: ThemeToggleProps) {
  const [theme, setTheme] = useState<Theme>("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const initial = getInitialTheme();
    setTheme(initial);
    applyTheme(initial);
  }, []);

  const toggleTheme = () => {
    const nextTheme: Theme = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);
    localStorage.setItem("theme", nextTheme);
    applyTheme(nextTheme);
  };

  if (!mounted) {
    return (
      <div className={`w-9 h-9 rounded-full bg-muted border border-border flex items-center justify-center ${className}`} />
    );
  }

  return (
    <button
      onClick={toggleTheme}
      type="button"
      aria-label="Toggle Theme"
      className={`relative flex items-center justify-center p-2 rounded-full bg-muted text-muted-foreground hover:text-foreground hover:bg-accent hover:text-accent-foreground border border-border shadow-xs transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring ${className}`}
    >
      {theme === "dark" ? (
        <Sun className="w-4 h-4 text-primary transition-transform duration-200 rotate-0 hover:rotate-45" />
      ) : (
        <Moon className="w-4 h-4 text-foreground transition-transform duration-200 rotate-0 hover:-rotate-12" />
      )}
      {showLabel && (
        <span className="ml-2 text-xs font-medium text-foreground">
          {theme === "dark" ? "Light Mode" : "Dark Mode"}
        </span>
      )}
    </button>
  );
}
