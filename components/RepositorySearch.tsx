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
        <label className={`input input-bordered flex items-center gap-2 ${className}`}>
            <Search className="h-4 w-4 opacity-70" />
            <input
                type="text"
                placeholder={placeholder}
                className={`grow  ${inputClassName}`}
                value={value}
                onChange={(e) => onChange(e.target.value)}
            />
        </label>
    );
};
