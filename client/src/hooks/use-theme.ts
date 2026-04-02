import { useState, useEffect } from "react";

export type ColorPalette = "blue" | "pink" | "yellow" | "purple" | "green" | "orange" | "red" | "cyan";
export type ThemeMode = "light" | "dark";

export interface ThemeColors {
  from: string;
  to: string;
  accent: string;
  light: string;
}

const colorPalettes: Record<ColorPalette, ThemeColors> = {
  blue: {
    from: "from-blue-50 dark:from-slate-900",
    to: "to-indigo-100 dark:to-slate-800",
    accent: "bg-blue-500",
    light: "bg-blue-100/50 dark:bg-blue-900/30"
  },
  pink: {
    from: "from-pink-50 dark:from-slate-900",
    to: "to-rose-100 dark:to-slate-800",
    accent: "bg-pink-500",
    light: "bg-pink-100/50 dark:bg-pink-900/30"
  },
  yellow: {
    from: "from-yellow-50 dark:from-slate-900",
    to: "to-amber-100 dark:to-slate-800",
    accent: "bg-yellow-500",
    light: "bg-yellow-100/50 dark:bg-yellow-900/30"
  },
  purple: {
    from: "from-purple-50 dark:from-slate-900",
    to: "to-violet-100 dark:to-slate-800",
    accent: "bg-purple-500",
    light: "bg-purple-100/50 dark:bg-purple-900/30"
  },
  green: {
    from: "from-green-50 dark:from-slate-900",
    to: "to-emerald-100 dark:to-slate-800",
    accent: "bg-green-500",
    light: "bg-green-100/50 dark:bg-green-900/30"
  },
  orange: {
    from: "from-orange-100 dark:from-slate-900",
    to: "to-orange-200 dark:to-orange-950/40",
    accent: "bg-orange-500",
    light: "bg-orange-100/50 dark:bg-orange-900/30"
  },
  red: {
    from: "from-red-50 dark:from-slate-900",
    to: "to-rose-100 dark:to-slate-800",
    accent: "bg-red-500",
    light: "bg-red-100/50 dark:bg-red-900/30"
  },
  cyan: {
    from: "from-cyan-50 dark:from-slate-900",
    to: "to-blue-100 dark:to-slate-800",
    accent: "bg-cyan-500",
    light: "bg-cyan-100/50 dark:bg-cyan-900/30"
  }
};

export function useTheme() {
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    const stored = localStorage.getItem("theme-mode");
    if (stored) return stored === "dark";
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  const [colorPalette, setColorPalette] = useState<ColorPalette>(() => {
    if (typeof window === "undefined") return "blue";
    return (localStorage.getItem("color-palette") as ColorPalette) || "blue";
  });

  useEffect(() => {
    localStorage.setItem("theme-mode", isDark ? "dark" : "light");
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDark]);

  useEffect(() => {
    localStorage.setItem("color-palette", colorPalette);
  }, [colorPalette]);

  const toggleTheme = () => setIsDark(!isDark);
  const changeColorPalette = (palette: ColorPalette) => setColorPalette(palette);
  const colors = colorPalettes[colorPalette];

  return {
    isDark,
    colorPalette,
    colors,
    toggleTheme,
    changeColorPalette,
    allPalettes: Object.keys(colorPalettes) as ColorPalette[]
  };
}
