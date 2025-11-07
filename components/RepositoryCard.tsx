import { Repository } from "@/lib/github";
import { FolderGit2, Star, Lock, Globe, User } from "lucide-react";

interface RepositoryCardProps {
  readonly repository: Repository;
  readonly onClick: () => void;
}

export function RepositoryCard({ repository, onClick }: RepositoryCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="card bg-base-100 shadow-xl cursor-pointer hover:shadow-2xl transition-shadow text-left w-full focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/70 hover:bg-primary/10"
    >
      <div className="card-body">
        <div className="flex items-start justify-between">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <FolderGit2 className="h-5 w-5 text-primary" />
              <h3 className="card-title text-lg text-base-content">
                {repository.name}
              </h3>
            </div>
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
          <p className="text-sm text-base-content opacity-70 line-clamp-2">
            {repository.description}
          </p>
        )}

        <div className="flex gap-4 justify-between text-sm text-base-content ">
          <div className="flex gap-4">
            {repository.language && (
              <div className="badge badge-outline gap-1">
                <span className="h-2 w-2 rounded-full bg-primary"></span>
                {repository.language}
              </div>
            )}
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4" />
              {repository.stargazers_count}
            </div>
          </div>
          <div className="flex items-center gap-1 text-sm text-base-content opacity-70 ml-7">
              <User className="h-4 w-" />
              <span>{repository.owner}</span>
          </div>
        </div>
      </div>
    </button>
  );
}
