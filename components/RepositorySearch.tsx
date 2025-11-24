import React from "react";
import { Search } from "lucide-react";

interface RepositorySearchProps {
    readonly value: string;
    readonly onChange: (value: string) => void;
    readonly placeholder?: string;
    readonly className?: string;
    readonly inputClassName?: string;
}

export const RepositorySearch: React.FC<RepositorySearchProps> = ({
    value,
    onChange,
    placeholder = "Search repositories...",
    className = "",
    inputClassName = "",
}) => {
    return (
        <div className={`relative group ${className}`}>
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-base-content/40 group-focus-within:text-primary transition-colors" />
            </div>
            <input
                type="text"
                placeholder={placeholder}
                className={`input input-bordered w-full pl-10 bg-base-100/50 focus:bg-base-100 transition-all shadow-sm focus:shadow-md focus:border-primary/50 ${inputClassName}`}
                value={value}
                onChange={(e) => onChange(e.target.value)}
            />
        </div>
    );
};
