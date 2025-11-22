import { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  readonly icon: LucideIcon;
  readonly message: string;
}

export function EmptyState({ icon: Icon, message }: EmptyStateProps) {
  return (
    <div className="text-center py-12">
      <Icon className="mx-auto h-12 w-12 text-zinc-400" />
      <p className="mt-4 text-base-content opacity-70">
        {message}
      </p>
    </div>
  );
}
