import { useInfiniteQuery } from "@tanstack/react-query";
import { GitHubAPIService, Repository } from "@/lib/github";
import { queryKeys } from "@/lib/query-keys";

export interface UseRepositoriesResult {
  repositories: Repository[];
  isLoading: boolean;
  isLoadingMore: boolean;
  error: string | null;
  hasMore: boolean;
  page: number;
  refetch: () => Promise<void>;
  loadMore: () => Promise<void>;
}

const PER_PAGE = 15;

export function useRepositories(
  githubToken: string | null
): UseRepositoriesResult {
  const {
    data,
    isLoading,
    isFetchingNextPage,
    error,
    hasNextPage,
    fetchNextPage,
    refetch,
  } = useInfiniteQuery({
    queryKey: queryKeys.repositories.infinite(PER_PAGE),
    queryFn: async ({ pageParam }) => {
      if (!githubToken) {
        throw new Error("GitHub token is required");
      }
      return GitHubAPIService.getRepositories(githubToken, pageParam, PER_PAGE);
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage, _allPages, lastPageParam) => {
      return lastPage.has_more ? lastPageParam + 1 : undefined;
    },
    enabled: !!githubToken,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Flatten all pages into a single array of repositories
  const repositories = data?.pages.flatMap((page) => page.repositories) ?? [];
  const lastPage = data?.pages.length ?? 1;

  return {
    repositories,
    isLoading,
    isLoadingMore: isFetchingNextPage,
    error: error?.message ?? null,
    hasMore: hasNextPage ?? false,
    page: lastPage,
    refetch: async () => {
      await refetch();
    },
    loadMore: async () => {
      if (hasNextPage && !isFetchingNextPage) {
        await fetchNextPage();
      }
    },
  };
}
