import { ReactNode } from "react";
import Image from "next/image";
import { ThemeToggle } from "./ThemeToggle";

interface User {
  username: string;
  avatar_url?: string;
  email?: string;
}

interface PageHeaderProps {
  children?: ReactNode;
  user?: User | null;
  showUser?: boolean;
}

export function PageHeader({ children, user, showUser = false }: PageHeaderProps) {
  return (
    <nav className="bg-base-100 border-b border-base-300">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-1">
            {children}
          </div>
          
          <div className="flex items-center gap-2">
            <ThemeToggle />
            
            {showUser && user && (
              <div className="flex items-center gap-3 border-l border-base-300 pl-4">
                {user.avatar_url && (
                  <Image
                    src={user.avatar_url}
                    alt={`${user.username}'s avatar`}
                    width={32}
                    height={32}
                    className="rounded-full ring-2 ring-base-300"
                  />
                )}
                <div className="hidden sm:block">
                  <p className="text-sm font-medium">
                    {user.username}
                  </p>
                  {user.email && (
                    <p className="text-xs opacity-60">
                      {user.email}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
