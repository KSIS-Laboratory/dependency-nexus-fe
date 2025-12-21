"use client";

import Image from "next/image";
import Link from "next/link";
import { ThemeToggle } from "./ThemeToggle";
import { LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface PageHeaderProps {
  readonly children?: React.ReactNode;
  readonly user?: {
    username: string;
    email?: string;
    avatar_url?: string;
  } | null;
  readonly showUser?: boolean;
} 

export function PageHeader({ children, user, showUser = false }: PageHeaderProps) {
  const { logout } = useAuth();
  return (
    <nav className="sticky top-0 z-50 bg-base-100/80 backdrop-blur-md border-b border-base-300">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative flex h-16 items-center justify-between">
          {/* Left Side: Logo and Page Title (children) */}
          <div className="flex items-center gap-4 text-base-content">
            <Link href="/dashboard">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-6 w-6 cursor-pointer hover:text-primary transition-colors"
              >
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            </Link>
            {children}
          </div>

          {/* Center: Navigation Links (Absolutely positioned) */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hidden md:flex items-center gap-6">
            <Link href="/dashboard" className="text-sm font-medium hover:text-primary transition-colors">
              Dashboard
            </Link>
            <span className="text-sm font-medium hover:text-primary transition-colors">|</span>
            <Link href="/repositories" className="text-sm font-medium hover:text-primary transition-colors">
              Repositories
            </Link>
            <span className="text-sm font-medium hover:text-primary transition-colors">|</span>
            <Link href="/visualization" className="text-sm font-medium hover:text-primary transition-colors">
              Visualize
            </Link>
          </div>

          {/* Right Side: Theme Toggle and User Profile */}
          <div className="flex items-center gap-2">
            <ThemeToggle />
            {showUser && user && (
              <div className="flex items-center gap-3 border-l border-base-300 pl-4">
                {user.avatar_url && (
                  <Image
                    src={user.avatar_url}
                    alt={user.username}
                    width={36}
                    height={36}
                    className="rounded-full ring-2 ring-primary ring-offset-2 ring-offset-base-100 transition-all duration-200 hover:ring-secondary"
                  />
                )}
                <div className="hidden sm:block">
                  <p className="text-sm font-semibold text-base-content">
                    {user.username}
                  </p>
                  {user.email && (
                    <p className="text-xs text-base-content/60">
                      {user.email}
                    </p>
                  )}
                </div>
              </div>
            )}
            <button
            onClick={() => logout()}
            className="btn btn-error btn-ghost btn-circle"
          >
            <LogOut className="h-6 w-6"/>
          </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
