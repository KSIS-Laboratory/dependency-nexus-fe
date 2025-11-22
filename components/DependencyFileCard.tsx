import { FileCode, Database, HardDrive } from "lucide-react";
import { DependencyFile } from "@/lib/github";

type DependencyFileCardProps = Readonly<{
  filename: string;
  info: DependencyFile;
}>;

export function DependencyFileCard({ filename, info }: DependencyFileCardProps) {
  return (
    <div className="group relative overflow-hidden bg-base-100/50 hover:bg-base-100 border border-base-200 rounded-xl transition-all duration-300 hover:shadow-md hover:border-primary/20">
      <div className="absolute inset-0 bg-linear-to-r from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      <div className="relative p-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2 bg-base-200 rounded-lg text-primary group-hover:scale-110 transition-transform duration-300">
            <FileCode className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h4 className="font-semibold text-sm text-base-content truncate" title={filename}>
              {filename}
            </h4>
            <div className="flex items-center gap-2 text-xs text-base-content/60 mt-0.5">
              <span className="flex items-center gap-1">
                <Database className="h-3 w-3" />
                {info.type}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs font-medium text-base-content/70 bg-base-200/50 px-2 py-1 rounded-md whitespace-nowrap">
          <HardDrive className="h-3 w-3" />
          {(info.size / 1024).toFixed(2)} KB
        </div>
      </div>
    </div>
  );
}
