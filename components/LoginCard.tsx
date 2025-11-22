import type { SVGProps } from "react";

interface LoginCardProps {
  readonly onLogin: () => void;
}

const GithubMark = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
    <path
      fill="currentColor"
      d="M12 2a10 10 0 0 0-3.162 19.487c.5.091.686-.217.686-.483 0-.237-.009-.868-.013-1.703-2.793.607-3.381-1.347-3.381-1.347-.454-1.154-1.108-1.462-1.108-1.462-.907-.62.069-.607.069-.607 1.003.07 1.53 1.03 1.53 1.03.892 1.529 2.341 1.087 2.91.832.091-.646.35-1.087.636-1.337-2.231-.254-4.577-1.116-4.577-4.97 0-1.097.39-1.994 1.029-2.697-.103-.254-.446-1.275.098-2.657 0 0 .84-.269 2.75 1.03a9.564 9.564 0 0 1 2.503-.336 9.56 9.56 0 0 1 2.503.336c1.91-1.299 2.748-1.03 2.748-1.03.546 1.382.203 2.403.1 2.657.64.703 1.028 1.6 1.028 2.697 0 3.863-2.35 4.714-4.588 4.964.36.31.68.921.68 1.856 0 1.339-.012 2.418-.012 2.747 0 .268.183.58.691.481A10 10 0 0 0 12 2z"
    />
  </svg>
);

export function LoginCard({ onLogin }: LoginCardProps) {
  return (
    <div className="card w-full bg-base-100 shadow">
      <div className="card-body">
        <h2 className="card-title text-2xl text-base-content">
          Sign in to get started
        </h2>
        
        <button
          onClick={onLogin}
          className="btn btn-neutral base-300 btn-lg gap-3"
          aria-label="Sign in with GitHub"
        >
          <GithubMark className="h-5 w-5" />
          Continue with GitHub
        </button>

        <p className="text-center text-sm text-base-content opacity-60">
          Sign in with your GitHub account to access your repositories
        </p>
      </div>
    </div>
  );
}
