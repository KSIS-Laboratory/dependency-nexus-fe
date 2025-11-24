import { Repository } from "@/lib/github";
import { FolderGit2, Star, Lock, Globe, MessageCircle, Github, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { API_URL, API_ENDPOINTS } from "@/lib/constants";
import { AuthService } from "@/lib/auth";

interface RepositoryCardProps {
  readonly repository: Repository;
  readonly onClick: () => void;
  readonly onAskAI?: () => void;
}

export function RepositoryCard({ repository, onClick, onAskAI }: RepositoryCardProps) {
  const [hasHistory, setHasHistory] = useState(repository.has_history);

  useEffect(() => {
    const checkHistory = async () => {
      // If has_history is already true, no need to check
      if (repository.has_history) {
        setHasHistory(true);
        return;
      }

      try {
        const token = AuthService.getToken();
        if (!token) return;

        const historyPath = API_ENDPOINTS.VULNERABILITIES.HISTORY(`${repository.owner}/${repository.name}`);
        const response = await fetch(
          `${API_URL}${historyPath}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          if (data.total_scans > 0) {
            setHasHistory(true);
          }
        }
      } catch (error) {
        console.error("Failed to check history", error);
      }
    };

    checkHistory();
  }, [repository.owner, repository.name, repository.has_history]);

  return (
    <div
      className="group relative bg-base-100/50 backdrop-blur-md border border-base-00 rounded-2xl overflow-hidden hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500 hover:-translate-y-1"
    >
      {/* Gradient Overlay on Hover */}
      <div className="absolute inset-0 bg-linear-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

      <div className="card-body p-6 relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-linear-to-br from-primary/10 to-primary/5 rounded-xl text-primary group-hover:scale-110 transition-transform duration-500 shadow-sm">
              <FolderGit2 className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg leading-tight mb-1">
                <button
                  onClick={onClick}
                  className="text-left cursor-pointer focus:outline-none hover:text-primary transition-colors flex items-center gap-2"
                >
                  {repository.name}
                </button>
              </h3>
              <div className="flex items-center gap-2 text-xs text-base-content/60">
                <Link
                  href={`/repositories/${repository.owner}`}
                  className="flex items-center gap-1 hover:text-primary transition-colors hover:underline decoration-primary/30 underline-offset-2 z-20 relative"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Github className="h-3 w-3" />
                  {repository.owner}
                </Link>
              </div>
            </div>
          </div>
          <div className={`badge ${repository.private ? "badge-ghost bg-base-200/50" : "badge-outline border-primary/20 text-primary"} gap-1.5 py-3 px-3 font-medium`}>
            {repository.private ? (
              <>
                <Lock className="h-3.5 w-3.5" /> Private
              </>
            ) : (
              <>
                <Globe className="h-3.5 w-3.5" /> Public
              </>
            )}
          </div>
        </div>

        <p className="text-sm text-base-content/70 line-clamp-2 mb-6 min-h-[2.5em] leading-relaxed">
          {repository.description || "No description provided."}
        </p>

        <div className="mt-auto pt-4 border-t border-base-200/50 flex flex-wrap items-center justify-between gap-3 text-sm">
          <div className="flex items-center gap-4 text-base-content/60">
            {repository.language && (
              <div className="flex items-center gap-2" title="Language">
                <span className="h-2.5 w-2.5 rounded-full bg-primary shadow-[0_0_8px_rgba(var(--p),0.4)]"></span>
                <span className="font-medium">{repository.language}</span>
              </div>
            )}
            <div className="flex items-center gap-1.5" title="Stars">
              <Star className="h-4 w-4 text-warning fill-warning/20" />
              <span className="font-medium">{repository.stargazers_count}</span>
            </div>
          </div>

          {hasHistory && onAskAI && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAskAI();
              }}
              className="btn btn-sm btn-ghost text-secondary hover:bg-secondary/10 gap-2 rounded-lg transition-all duration-300 hover:scale-105 active:scale-95 z-20 relative"
            >
              <MessageCircle className="h-4 w-4" />
              Ask AI
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
