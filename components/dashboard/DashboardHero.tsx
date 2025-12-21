import { RefreshCcw, LayoutDashboard, Network } from "lucide-react";

interface DashboardHeroProps {
  userName?: string;
  onRefresh: () => void;
  onViewRepositories: () => void;
  onViewGraph: () => void;
}

export function DashboardHero({ userName = "team", onRefresh, onViewRepositories, onViewGraph }: Readonly<DashboardHeroProps>) {
  return (
    <div className="overflow-hidden rounded-2xl bg-linear-to-br from-primary to-secondary animate-slide-up shadow-xl">
      {/* Card Content */}
      <div className="relative">
        <div className="p-5 sm:p-8 md:p-10">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 sm:gap-6">
            {/* Welcome Text */}
            <div className="space-y-2 sm:space-y-3">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary-content">
                Welcome back, <span className="text-primary-content">{userName}</span>!
              </h1>
              <p className="text-primary-content/80 max-w-xl text-sm sm:text-base md:text-lg leading-relaxed">
                Here's what's happening with your projects today.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3">
              <button
                className="btn btn-ghost bg-base-100/20 hover:bg-base-100/30 text-primary-content border-0 gap-2"
                onClick={onRefresh}
                aria-label="Refresh dashboard data"
              >
                <RefreshCcw className="h-4 w-4" />
                Refresh
              </button>
              <button
                className="btn btn-ghost bg-base-100/20 hover:bg-base-100/30 text-primary-content border-0 gap-2"
                onClick={onViewRepositories}
              >
                <LayoutDashboard className="h-4 w-4" />
                Repositories
              </button>
              <button
                className="btn btn-ghost bg-base-100/20 hover:bg-base-100/30 text-primary-content border-0 gap-2"
                onClick={onViewGraph}
              >
                <Network className="h-4 w-4" />
                View Graph
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
