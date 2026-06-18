import { useEffect, useState } from "react";

export type FontScale = "sm" | "md" | "lg" | "xl";

const SCALE_VALUES: Record<FontScale, string> = {
  sm: "0.875",
  md: "1",
  lg: "1.125",
  xl: "1.25",
};

export const useFontSize = () => {
  const [fontScale, setFontScaleState] = useState<FontScale>("md");

  useEffect(() => {
    // Read from the CSS property already set by the blocking script in layout.tsx
    // This prevents a 1-frame mismatch where React state is "md" but the visual is a different scale
    const applied = getComputedStyle(document.documentElement)
      .getPropertyValue("--font-scale")
      .trim();
    const matched = (Object.keys(SCALE_VALUES) as FontScale[]).find(
      (k) => SCALE_VALUES[k] === applied
    );
    setFontScaleState(matched ?? "md");
  }, []);

  const setFontScale = (scale: FontScale) => {
    const value = SCALE_VALUES[scale];
    document.documentElement.style.setProperty("--font-scale", value);
    localStorage.setItem("app-font-scale", value);
    setFontScaleState(scale);
  };

  return { fontScale, setFontScale, SCALE_VALUES };
};
