import React from "react";
import { FileCode, Box } from "lucide-react";
import { DependencyFileCard } from "@/components/DependencyFileCard";
import { DependencySection } from "@/components/DependencySection";

interface DependenciesTabProps {
    analysis: any;
}

const isUnsupportedDependencyFile = (deps: unknown): deps is { raw_content: string } => {
    return typeof deps === "object" && deps !== null && "raw_content" in deps;
};

export const DependenciesTab: React.FC<DependenciesTabProps> = ({ analysis }) => {
    const dependencyEntries = Object.entries(analysis?.dependencies || {}).filter(
        ([, deps]) => !isUnsupportedDependencyFile(deps)
    );

    return (
        <div className="p-6 animate-in fade-in duration-300">
            <div className="grid gap-8 lg:grid-cols-12 items-start">
                {/* Left Column: Dependency Files */}
                <div className="lg:col-span-4 xl:col-span-3">
                    <div className="sticky top-24 space-y-6">
                        <div className="card bg-base-200/50 border border-base-300 shadow-sm">
                            <div className="card-body p-5">
                                <h3 className="font-bold text-lg flex items-center gap-2 text-base-content mb-4">
                                    <FileCode className="h-5 w-5 text-primary" />
                                    Files
                                    <div className="badge badge-primary badge-sm ml-auto">
                                        {Object.keys(analysis?.dependency_files || {}).length}
                                    </div>
                                </h3>
                                <div className="space-y-3">
                                    {Object.entries(analysis?.dependency_files || {}).map(([filename, info]) => (
                                        <DependencyFileCard
                                            key={filename}
                                            filename={filename}
                                            info={info as any}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="card bg-primary/5 border border-primary/10 shadow-sm">
                            <div className="card-body p-5">
                                <div className="flex items-center gap-3 mb-2">
                                    <Box className="h-5 w-5 text-primary" />
                                    <h4 className="font-semibold text-primary">Total Dependencies</h4>
                                </div>
                                <p className="text-3xl font-bold text-base-content">
                                    {dependencyEntries.reduce((acc, [, deps]: [string, any]) => {
                                        return acc + (Array.isArray(deps) ? deps.length : Object.keys(deps).length);
                                    }, 0)}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Content */}
                <div className="lg:col-span-8 xl:col-span-9 space-y-6">
                    {dependencyEntries.map(([filename, deps]: [string, any]) => (
                        <DependencySection
                            key={filename}
                            filename={filename}
                            dependencies={deps}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};
