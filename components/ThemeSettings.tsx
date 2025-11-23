"use client";

import { useTheme } from "../lib/ThemeContext";

export default function ThemeSettings() {
  const { theme, toggleTheme, fontSize, setFontSize } = useTheme();

  return (
    <div className="flex items-center gap-4 text-xs">
      <div className="flex items-center gap-1 border border-brown-700 rounded px-2 py-1">
        <span className="text-amber-200">A</span>
        <button
          onClick={() => setFontSize("small")}
          className={`px-1 hover:text-amber-500 ${fontSize === "small" ? "text-amber-500 font-bold" : "text-amber-200"}`}
        >
          -
        </button>
        <button
          onClick={() => setFontSize("medium")}
          className={`px-1 hover:text-amber-500 ${fontSize === "medium" ? "text-amber-500 font-bold" : "text-amber-200"}`}
        >
          =
        </button>
        <button
          onClick={() => setFontSize("large")}
          className={`px-1 hover:text-amber-500 ${fontSize === "large" ? "text-amber-500 font-bold" : "text-amber-200"}`}
        >
          +
        </button>
      </div>

      <button
        onClick={toggleTheme}
        className="flex items-center gap-2 hover:text-amber-500 text-amber-200"
        title="Przełącz motyw"
      >
        {theme === "dark" ? (
          <>
            <span>🌙</span>
          </>
        ) : (
          <>
            <span>☀️</span>
          </>
        )}
      </button>
    </div>
  );
}
