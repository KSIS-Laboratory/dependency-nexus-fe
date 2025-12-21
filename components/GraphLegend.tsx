import React from 'react';

export interface LegendItem {
    label: string;
    color: string;
}

interface GraphLegendProps {
    items: LegendItem[];
    className?: string;
}

export const GraphLegend: React.FC<GraphLegendProps> = ({ items, className = "" }) => {
    return (
        <div className={`absolute bottom-4 right-4 bg-white/90 p-4 rounded-lg shadow-lg border border-neutral text-sm z-10 ${className}`}>
            <h3 className="font-bold mb-2 text-neutral">Legend</h3>
            <div className="flex flex-col gap-2">
                {items.map((item) => (
                    <div key={item.label} className="flex items-center gap-2">
                        <span
                            className="w-3 h-3 rounded-full border border-gray-200"
                            style={{ backgroundColor: item.color }}
                        ></span>
                        <span className="font-medium text-neutral">{item.label}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};
