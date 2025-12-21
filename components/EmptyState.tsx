import React from "react";
import { Shield, LucideIcon } from "lucide-react";

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: LucideIcon;
  onScan?: () => void;
  isScanning?: boolean;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = "No security scan data",
  description = "Run a vulnerability scan to check your dependencies for known security issues.",
  icon: Icon = Shield,
  onScan,
  isScanning = false,
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="bg-base-200 p-6 rounded-full mb-4">
        <Icon className="h-12 w-12 text-base-content/60" />
      </div>
      <h3 className="text-lg font-bold mb-2 text-base-content">{title}</h3>
      <p className="text-base-content/60 max-w-sm mb-6">
        {description}
      </p>
      {onScan && (
        <button
          onClick={onScan}
          disabled={isScanning}
          className="btn btn-primary"
        >
          {isScanning ? "Scanning..." : "Scan Now"}
        </button>
      )}
    </div>
  );
};
