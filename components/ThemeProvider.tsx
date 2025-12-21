"use client";

import { useEffect } from "react";

export function ThemeProvider({ children }: { readonly children: React.ReactNode }) {
    useEffect(() => {
        // Get theme from localStorage or system preference
        const savedTheme = localStorage.getItem("theme");
        const systemTheme = globalThis.matchMedia("(prefers-color-scheme: dark)").matches
            ? "dark"
            : "light";
        const initialTheme = savedTheme || systemTheme;
        document.documentElement.dataset.theme = initialTheme;
    }, []);

    return <>{children}</>;
}
