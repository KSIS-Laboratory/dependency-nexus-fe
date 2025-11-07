import { FileCode } from "lucide-react";
import { DependencyFile } from "@/lib/github";

type DependencyFileCardProps = Readonly<{
  filename: string;
  info: DependencyFile;
}>;

export function DependencyFileCard({ filename, info }: DependencyFileCardProps) {
  return (
    <div className="card bg-base-100 shadow-md hover:shadow-lg transition-shadow border border-base-300">
      <div className="card-body p-4">
        <div className="flex items-center gap-2">
          <FileCode className="h-5 w-5 text-primary" />
          <h4 className="card-title text-base-content">
            {filename}
          </h4>
        </div>
        <div className="flex gap-2 mt-2 text-sm text-base-content">
          <div className="badge badge-primary badge-sm">
            {info.type}
          </div>
          <div className="badge badge-primary badge-sm">
            {(info.size / 1024).toFixed(2)} KB
          </div>
        </div>
      </div>
    </div>
  );
}
