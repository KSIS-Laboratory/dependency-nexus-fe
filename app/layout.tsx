import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/ThemeProvider";
import { QueryProvider } from "@/components/QueryProvider";
import CopyrightFooter from "@/components/CopyrightFooter";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Dependency Nexus",
  description: "Analyze and manage your project dependencies",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var savedTheme = localStorage.getItem("theme");
                  var systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
                  var theme = savedTheme || systemTheme;
                  document.documentElement.setAttribute("data-theme", theme);
                } catch (e) {}
              })()
            `,
          }}
        />
        {/* <DecorativeElements /> */}
        <ThemeProvider>
          <QueryProvider>
            <div className="flex flex-col min-h-screen">
              <main className="flex-1">{children}</main>
              <CopyrightFooter />
            </div>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
