import { useState, useEffect } from "react";

type Theme = "light" | "dark";

const getSystemTheme = (): Theme => {
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
};

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window !== "undefined") {
      // ✅ First check saved theme
      const saved = localStorage.getItem("theme") as Theme | null;
      if (saved === "light" || saved === "dark") return saved;

      // ✅ Otherwise use device theme
      return getSystemTheme();
    }
    return "light";
  });

  useEffect(() => {
    const root = document.documentElement;

    root.classList.remove("light", "dark");
    root.classList.add(theme);

    localStorage.setItem("theme", theme);
  }, [theme]);

  // 🔄 Optional: Auto update ONLY if user hasn't manually changed theme
  useEffect(() => {
    const saved = localStorage.getItem("theme");

    // ❗ If user already chose manually → don't override
    if (saved === "light" || saved === "dark") return;

    const media = window.matchMedia("(prefers-color-scheme: dark)");

    const handleChange = () => {
      setThemeState(getSystemTheme());
    };

    media.addEventListener("change", handleChange);

    return () => {
      media.removeEventListener("change", handleChange);
    };
  }, []);

  const toggleTheme = () => {
    setThemeState((t) => (t === "dark" ? "light" : "dark"));
  };

  return {
    theme,
    setTheme: setThemeState,
    toggleTheme,
  };
}