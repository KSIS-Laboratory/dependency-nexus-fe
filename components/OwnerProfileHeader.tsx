import Image from "next/image";
import { Github, ExternalLink, Search, Star, BookOpen, Code2 } from "lucide-react";

interface OwnerProfileHeaderProps {
    readonly owner: string;
    readonly repositoryCount: number;
    readonly totalStars: number;
    readonly languages: string[];
    readonly searchQuery: string;
    readonly onSearchChange: (query: string) => void;
}

export function OwnerProfileHeader({
    owner,
    repositoryCount,
    totalStars,
    languages,
    searchQuery,
    onSearchChange,
}: Readonly<OwnerProfileHeaderProps>) {
    return (
        <div className="relative overflow-hidden rounded-3xl bg-base-100 shadow-lg border border-base-200 mb-8">
            <div className="absolute inset-0 bg-linear-to-r from-primary/5 via-secondary/5 to-accent/5 opacity-50" />
            <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none">
                <Github className="w-64 h-64 rotate-12" />
            </div>

            <div className="relative z-10 p-8 md:p-10">
                <div className="flex flex-col md:flex-row items-start md:items-center gap-8">
                    <div className="relative group">
                        <div className="absolute -inset-1 bg-linear-to-br from-primary to-secondary rounded-full opacity-70 blur-sm group-hover:opacity-100 transition-opacity duration-500"></div>
                        <Image
                            src={`https://github.com/${owner}.png`}
                            alt={owner}
                            width={100}
                            height={100}
                            className="relative rounded-full border-4 border-base-100 shadow-xl"
                            unoptimized
                        />
                    </div>

                    <div className="flex-1">
                        <div className="flex items-center gap-4 mb-2">
                            <h1 className="text-4xl font-bold text-base-content tracking-tight">{owner}</h1>
                            <a
                                href={`https://github.com/${owner}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn btn-ghost btn-circle btn-sm text-base-content/50 hover:text-primary hover:bg-primary/10"
                                title="View on GitHub"
                            >
                                <ExternalLink className="h-5 w-5" />
                            </a>
                        </div>

                        <div className="flex flex-wrap items-center gap-6 text-base-content/70">
                            <div className="flex items-center gap-2">
                                <BookOpen className="h-4 w-4 text-primary" />
                                <span className="font-medium">{repositoryCount}</span>
                                <span>Repositories</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Star className="h-4 w-4 text-warning" />
                                <span className="font-medium">{totalStars}</span>
                                <span>Total Stars</span>
                            </div>
                            {languages.length > 0 && (
                                <div className="flex items-center gap-2">
                                    <Code2 className="h-4 w-4 text-secondary" />
                                    <span className="font-medium">{languages.length}</span>
                                    <span>Languages</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="w-full md:w-auto">
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Search className="h-5 w-5 text-base-content/40 group-focus-within:text-primary transition-colors" />
                            </div>
                            <input
                                type="text"
                                placeholder="Search in this owner..."
                                className="input input-lg input-bordered pl-10 w-full md:w-80 bg-base-100/50 focus:bg-base-100 transition-all shadow-sm focus:shadow-md focus:border-primary/50"
                                value={searchQuery}
                                onChange={(e) => onSearchChange(e.target.value)}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
