"use client";

import { Loader2 } from "lucide-react";

interface VisualizationLoadingOverlayProps {
    readonly message?: string;
}

export const VisualizationLoadingOverlay: React.FC<VisualizationLoadingOverlayProps> = ({
    message = "Loading..."
}) => {
    return (
        <div className="absolute inset-0 flex items-center justify-center bg-base-100/80 backdrop-blur-sm z-20">
            <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
                <span className="text-sm text-base-content/70">{message}</span>
            </div>
        </div>
    );
};
