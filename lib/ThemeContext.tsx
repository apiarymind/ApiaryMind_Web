"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

type Theme = "dark" | "light";
type FontSize = "small" | "medium" | "large";

interface ThemeContextType {
  theme: Theme;
  fontSize: FontSize;
  toggleTheme: () => void;
  setFontSize: (size: FontSize) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("dark");
  const [fontSize, setFontSizeState] = useState<FontSize>("medium");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const storedTheme = localStorage.getItem("theme") as Theme;
    const storedFontSize = localStorage.getItem("fontSize") as FontSize;

    if (storedTheme) setThemeState(storedTheme);
    if (storedFontSize) setFontSizeState(storedFontSize);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme, mounted]);

  useEffect(() => {
    if (!mounted) return;
    document.documentElement.setAttribute("data-font-size", fontSize);
    localStorage.setItem("fontSize", fontSize);
  }, [fontSize, mounted]);

  const toggleTheme = () => {
    setThemeState((prev) => (prev === "dark" ? "light" : "dark"));
  };

  const setFontSize = (size: FontSize) => {
    setFontSizeState(size);
  };

  // Prevent hydration mismatch by rendering children only after mount,
  // or accept that server rendering might differ slightly (usually okay for theme attributes on html tag if handled in script, but here we do it in effect)
  // For static export, the default "dark" will be used initially until JS loads.

  return (
    <ThemeContext.Provider value={{ theme, fontSize, toggleTheme, setFontSize }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
