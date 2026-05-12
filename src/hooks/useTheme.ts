import { useEffect, useState } from "react";

type Theme = "light" | "dark" | "system";

export const useTheme = () => {
  const [theme, setTheme] = useState<Theme>("system");

  useEffect(() => {
    const saved = (localStorage.getItem("app-theme") as Theme) || "system";
    setTheme(saved);
  }, []);

  useEffect(() => {
    const root = window.document.documentElement;
    const systemMedia = window.matchMedia("(prefers-color-scheme: dark)");

    const applyTheme = (currentTheme: Theme) => {
      root.classList.remove("light", "dark");

      if (currentTheme === "system") {
        const systemMode = systemMedia.matches ? "dark" : "light";
        root.classList.add(systemMode);
      } else {
        root.classList.add(currentTheme);
      }
    };

    applyTheme(theme);
    localStorage.setItem("app-theme", theme);

    const listener = () => {
      if (theme === "system") applyTheme("system");
    };

    systemMedia.addEventListener("change", listener);

    return () => systemMedia.removeEventListener("change", listener);
  }, [theme]);

  return { theme, setTheme };
};
