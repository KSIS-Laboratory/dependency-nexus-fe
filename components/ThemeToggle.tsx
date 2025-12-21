"use client";

import { useEffect, useState } from "react";
import { Palette, Check } from "lucide-react";

const THEMES = {
  light: [
    "light", "cupcake", "bumblebee", "emerald", "corporate",
    "retro", "cyberpunk", "valentine", "garden", "lofi",
    "pastel", "fantasy", "wireframe", "cmyk", "autumn",
    "acid", "lemonade", "winter", "nord"
  ],
  dark: [
    "dark", "synthwave", "halloween", "forest", "aqua",
    "luxury", "dracula", "business", "night", "coffee",
    "dim", "sunset", "abyss"
  ]
} as const;

type Theme = typeof THEMES.light[number] | typeof THEMES.dark[number];

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem("theme") as Theme;
    const systemTheme = globalThis.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
    const initialTheme = savedTheme || systemTheme;
    setTheme(initialTheme as Theme);
    document.documentElement.dataset.theme = initialTheme;
  }, []);

  const changeTheme = (newTheme: Theme) => {
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.dataset.theme = newTheme;
  };

  if (!mounted) {
    return (
      <button className="btn btn-ghost btn-circle btn-sm" disabled>
        <Palette className="h-4 w-4" />
      </button>
    );
  }

  return (
    <div className="dropdown dropdown-end">
      <button tabIndex={0} className="btn btn-ghost btn-sm gap-2">
        <Palette className="h-4 w-4" />
        <span className="hidden sm:inline capitalize">{theme}</span>
        <svg className="h-3 w-3 fill-current opacity-60" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2048 2048">
          <path d="M1024 1229L467 672h1114z" />
        </svg>
      </button>
      <div
        tabIndex={0}
        className="dropdown-content z-100 mt-2 max-h-96 w-52 overflow-y-auto rounded-box bg-base-200 p-2 shadow-xl"
      >
        {/* Light Themes */}
        <div className="px-2 py-1 text-xs font-semibold text-base-content/60 uppercase tracking-wider">
          Light Themes
        </div>
        {THEMES.light.map((t) => (
          <button
            key={t}
            className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm capitalize transition-colors hover:bg-base-300 ${theme === t ? "bg-primary/10 text-primary font-medium" : ""
              }`}
            onClick={() => changeTheme(t)}
          >
            <div
              data-theme={t}
              className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-base-100 ring-1 ring-base-content/20"
            >
              <div className="h-2 w-2 rounded-full bg-primary" />
            </div>
            <span className="flex-1 text-left">{t}</span>
            {theme === t && <Check className="h-4 w-4 text-primary" />}
          </button>
        ))}

        <div className="divider my-1" />

        {/* Dark Themes */}
        <div className="px-2 py-1 text-xs font-semibold text-base-content/60 uppercase tracking-wider">
          Dark Themes
        </div>
        {THEMES.dark.map((t) => (
          <button
            key={t}
            className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm capitalize transition-colors hover:bg-base-300 ${theme === t ? "bg-primary/10 text-primary font-medium" : ""
              }`}
            onClick={() => changeTheme(t)}
          >
            <div
              data-theme={t}
              className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-base-100 ring-1 ring-base-content/20"
            >
              <div className="h-2 w-2 rounded-full bg-primary" />
            </div>
            <span className="flex-1 text-left">{t}</span>
            {theme === t && <Check className="h-4 w-4 text-primary" />}
          </button>
        ))}
      </div>
    </div>
  );
}
