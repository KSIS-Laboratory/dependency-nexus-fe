import { RefreshCcw } from "lucide-react";

interface DashboardHeroProps {
  userName?: string;
  onRefresh: () => void;
  onViewRepositories: () => void;
}

export function DashboardHero({ userName = "team", onRefresh, onViewRepositories }: Readonly<DashboardHeroProps>) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div>
        <p className="text-base-content/60 text-sm sm:text-base">Welcome back, {userName}</p>
        <h2 className="text-2xl font-bold text-base-content sm:text-3xl">
          Monitor the health of your repositories at a glance
        </h2>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:self-end md:self-auto">
        <button className="btn btn-outline btn-secondary gap-2" onClick={onRefresh}>
          <RefreshCcw className="h-4 w-4" /> Refresh data
        </button>
        <button className="btn btn-primary" onClick={onViewRepositories}>
          View repositories
        </button>
      </div>
    </div>
  );
}
