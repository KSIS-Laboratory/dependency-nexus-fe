import { Repository } from "@/lib/github";
import { FolderGit2, Star, Lock, Globe } from "lucide-react";

interface RepositoryCardProps {
  repository: Repository;
  onClick: () => void;
}

export function RepositoryCard({ repository, onClick }: RepositoryCardProps) {
  return (
    <div
      className="card bg-base-100 shadow-xl cursor-pointer hover:shadow-2xl transition-shadow"
      onClick={onClick}
    >
      <div className="card-body">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <FolderGit2 className="h-5 w-5 opacity-70" />
            <h3 className="card-title text-lg">
              {repository.name}
            </h3>
          </div>
          <div className="badge badge-sm" title={repository.private ? "Private" : "Public"}>
            {repository.private ? (
              <Lock className="h-3 w-3" />
            ) : (
              <Globe className="h-3 w-3" />
            )}
          </div>
        </div>

        {repository.description && (
          <p className="text-sm opacity-70 line-clamp-2">
            {repository.description}
          </p>
        )}

        <div className="flex items-center gap-4 text-sm opacity-60">
          {repository.language && (
            <div className="badge badge-outline gap-1">
              <span className="h-2 w-2 rounded-full bg-primary"></span>
              {repository.language}
            </div>
          )}
          <span className="flex items-center gap-1">
            <Star className="h-4 w-4" />
            {repository.stargazers_count}
          </span>
        </div>

        <div className="card-actions justify-end mt-4">
          <button className="btn btn-neutral btn-sm w-full">
            Analyze Dependencies
          </button>
        </div>
      </div>
    </div>
  );
}
