"use client";

import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

export function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Get theme from localStorage or system preference
    const savedTheme = localStorage.getItem("theme");
    const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
    const initialTheme = (savedTheme as "light" | "dark") || systemTheme;
    setTheme(initialTheme);
    document.documentElement.setAttribute("data-theme", initialTheme);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
  };

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <button className="btn btn-ghost btn-circle" disabled>
        <Sun className="h-5 w-5" />
      </button>
    );
  }

  return (
    <label className="swap swap-rotate btn btn-ghost btn-circle">
      <input
        type="checkbox"
        className="theme-controller"
        checked={theme === "dark"}
        onChange={toggleTheme}
      />
      
      {/* Sun icon */}
      <Sun className="swap-off h-5 w-5" />
      
      {/* Moon icon */}
      <Moon className="swap-on h-5 w-5" />
    </label>
  );
}
