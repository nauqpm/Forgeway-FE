'use client';

import { Sun, Moon, Monitor } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";

interface ThemeToggleProps {
  className?: string;
}

export default function ThemeToggle({ className = "" }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();

  const cycleTheme = () => {
    if (theme === 'light') setTheme('dark');
    else if (theme === 'dark') setTheme('system');
    else setTheme('light');
  };

  return (
    <button
      onClick={cycleTheme}
      className={`p-2 hover:bg-[#F7F6F3] dark:hover:bg-white/5 rounded-[6px] transition-colors ${className}`}
      title={`Theme: ${theme}`}
      aria-label={`Current theme: ${theme}. Click to change.`}
    >
      {theme === 'dark' ? (
        <Moon className="w-4 h-4 text-[#787774] dark:text-[#9B9A97]" />
      ) : theme === 'system' ? (
        <Monitor className="w-4 h-4 text-[#787774] dark:text-[#9B9A97]" />
      ) : (
        <Sun className="w-4 h-4 text-[#787774] dark:text-[#9B9A97]" />
      )}
    </button>
  );
}
