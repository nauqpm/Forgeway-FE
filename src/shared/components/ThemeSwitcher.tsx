"use client";

import React from "react";
import { useTheme } from "@/shared/hooks/useTheme";
import { Sun, Moon, Monitor } from "lucide-react";

export default function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();

  const options = [
    {
      id: "light",
      label: "Light",
      icon: <Sun className="w-6 h-6 mb-2" />,
      description: "Always light",
    },
    {
      id: "dark",
      label: "Dark",
      icon: <Moon className="w-6 h-6 mb-2" />,
      description: "Always dark",
    },
    {
      id: "system",
      label: "Match browser",
      icon: <Monitor className="w-6 h-6 mb-2" />,
      description: "Sync with system",
    },
  ];

  return (
    <div className="p-6 bg-white dark:bg-[#202020] rounded-[8px] border border-[#EAEAEA] dark:border-white/[0.06] w-full">
      <div className="mb-6">
        <h2 className="text-[0.9375rem] font-semibold text-[#111111] dark:text-[#E8E8E7]">Appearance</h2>
        <p className="text-[0.8125rem] text-[#787774] dark:text-[#9B9A97] mt-1">
          Customize the look and feel of the application.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {options.map((option) => (
          <button
            key={option.id}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            onClick={() => setTheme(option.id as any)}
            className={`flex flex-col items-center justify-center p-4 rounded-[8px] border-2 transition-all duration-200 ${
              theme === option.id
                ? "border-[#2563EB] bg-[#EFF6FF] dark:bg-[rgba(37,99,235,0.12)] text-[#2563EB] dark:text-[#3B82F6]"
                : "border-[#EAEAEA] dark:border-white/[0.06] text-[#787774] dark:text-[#9B9A97] hover:border-[#2563EB]/30 hover:bg-[#F7F6F3] dark:hover:bg-white/5"
            }`}
          >
            {option.icon}
            <span className="font-medium">{option.label}</span>
            <span className="text-xs text-center mt-1 opacity-70">
              {option.description}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
