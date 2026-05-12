"use client";

import React from "react";
import { useTheme } from "@/hooks/useTheme";
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
    <div className="p-6 bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 w-full max-w-2xl">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Appearance</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Customize the look and feel of the application.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {options.map((option) => (
          <button
            key={option.id}
            onClick={() => setTheme(option.id as any)}
            className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all duration-200 ${
              theme === option.id
                ? "border-primary bg-primary/5 text-primary dark:border-primary dark:bg-primary/10 dark:text-white"
                : "border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50"
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
