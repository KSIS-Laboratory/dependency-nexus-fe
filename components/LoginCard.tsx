import { GithubIcon } from "lucide-react";

interface LoginCardProps {
  onLogin: () => void;
}

export function LoginCard({ onLogin }: LoginCardProps) {
  return (
    <div className="card w-full bg-base-100 shadow">
      <div className="card-body">
        <h2 className="card-title text-2xl">
          Sign in to get started
        </h2>
        
        <button
          onClick={onLogin}
          className="btn btn-neutral base-300 btn-lg gap-3"
          aria-label="Sign in with GitHub"
        >
          <GithubIcon className="h-5 w-5" />
          Continue with GitHub
        </button>

        <p className="text-center text-sm opacity-60">
          Sign in with your GitHub account to access your repositories
        </p>
      </div>
    </div>
  );
}
