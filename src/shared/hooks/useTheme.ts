import { useEffect, useState } from "react";

export type Theme = "light" | "dark" | "system";

let globalTheme: Theme = "system";
const listeners = new Set<(theme: Theme) => void>();

function getInitialTheme(): Theme {
  if (typeof window === "undefined") return "system";
  try {
    return (localStorage.getItem("app-theme") as Theme) || "system";
  } catch {
    return "system";
  }
}

function applyThemeToDOM(currentTheme: Theme) {
  if (typeof window === "undefined") return;
  const root = window.document.documentElement;
  const systemMedia = window.matchMedia("(prefers-color-scheme: dark)");

  root.classList.remove("light", "dark");
  if (currentTheme === "system") {
    const systemMode = systemMedia.matches ? "dark" : "light";
    root.classList.add(systemMode);
  } else {
    root.classList.add(currentTheme);
  }
}

export const useTheme = () => {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window !== "undefined") {
      const saved = getInitialTheme();
      globalTheme = saved;
      return saved;
    }
    return "system";
  });

  useEffect(() => {
    const saved = getInitialTheme();
    if (saved !== theme) {
      setThemeState(saved);
      globalTheme = saved;
    }

    const handleStoreChange = (newTheme: Theme) => {
      setThemeState(newTheme);
    };

    listeners.add(handleStoreChange);

    const systemMedia = window.matchMedia("(prefers-color-scheme: dark)");
    const handleSystemChange = () => {
      if (globalTheme === "system") {
        applyThemeToDOM("system");
      }
    };
    systemMedia.addEventListener("change", handleSystemChange);

    return () => {
      listeners.delete(handleStoreChange);
      systemMedia.removeEventListener("change", handleSystemChange);
    };
  }, [theme]);

  const setTheme = (newTheme: Theme) => {
    globalTheme = newTheme;
    try {
      localStorage.setItem("app-theme", newTheme);
    } catch (e) {
      console.error(e);
    }
    applyThemeToDOM(newTheme);
    listeners.forEach((listener) => listener(newTheme));
  };

  return { theme, setTheme };
};
