import { RefreshCcw, LayoutDashboard, Network } from "lucide-react";

interface DashboardHeroProps {
  userName?: string;
  onRefresh: () => void;
  onViewRepositories: () => void;
  onViewGraph: () => void;
}

export function DashboardHero({ userName = "team", onRefresh, onViewRepositories, onViewGraph }: Readonly<DashboardHeroProps>) {
  return (
    <div className="hero bg-base-100 rounded-box shadow-sm border border-base-200">
      <div className="hero-content flex-col lg:flex-row-reverse w-full justify-between p-8">
        <div className="flex gap-2">
          <button
            className="btn btn-ghost btn-sm gap-2"
            onClick={onRefresh}
            aria-label="Refresh dashboard data"
          >
            <RefreshCcw className="h-4 w-4" />
            Refresh
          </button>
          <button
            className="btn btn-primary btn-sm gap-2"
            onClick={onViewRepositories}
          >
            <LayoutDashboard className="h-4 w-4" />
            View Repositories
          </button>
          <button
            className="btn btn-secondary btn-sm gap-2"
            onClick={onViewGraph}
          >
            <Network className="h-4 w-4" />
            View Graph
          </button>
        </div>
        <div>
          <h1 className="text-3xl font-bold">
            Welcome back, <span className="text-primary">{userName}</span>!
          </h1>
          <p className="py-4 text-base-content/70 max-w-xl">
            Here's what's happening with your projects today. Check your vulnerability scans and repository health at a glance.
          </p>
        </div>
      </div>
    </div>
  );
}
