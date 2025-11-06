import { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  message: string;
}

export function EmptyState({ icon: Icon, message }: EmptyStateProps) {
  return (
    <div className="text-center py-12">
      <Icon className="mx-auto h-12 w-12 text-zinc-400" />
      <p className="mt-4 text-zinc-600 dark:text-zinc-400">
        {message}
      </p>
    </div>
  );
}
