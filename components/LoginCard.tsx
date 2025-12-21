"use client";

import { Github } from "lucide-react";

interface LoginCardProps {
  readonly onLogin: () => void;
}

export function LoginCard({ onLogin }: LoginCardProps) {
  return (
    <div className="card bg-base-100 shadow-2xl animate-scale-in w-full max-w-md">
      <div className="card-body items-center text-center">
        <h2 className="card-title text-2xl font-bold text-base-content mb-2">
          Welcome to Dependency Nexus
        </h2>
        <p className="text-base-content/60 mb-6 text-sm leading-relaxed">
          Sign in with GitHub to analyze your repository dependencies and identify vulnerabilities.
        </p>
        <div className="card-actions w-full">
          <button
            onClick={onLogin}
            className="btn btn-primary w-full gap-2"
          >
            <Github className="h-5 w-5" />
            Sign in with GitHub
          </button>
        </div>
        <p className="text-xs text-base-content/50 mt-4">
          We only access your repository information to analyze your dependencies and identify vulnerabilities.
        </p>
      </div>
    </div>
  );
}
