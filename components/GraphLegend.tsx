import React from 'react';

export interface LegendItem {
    label: string;
    color?: string;      // Hex color (legacy)
    colorClass?: string; // DaisyUI class like 'bg-error'
}

interface GraphLegendProps {
    items: LegendItem[];
    className?: string;
}

export const GraphLegend: React.FC<GraphLegendProps> = ({ items, className = "" }) => {
    return (
        <div className={`absolute bottom-4 bg-base-100/95 backdrop-blur-sm p-4 rounded-lg shadow-lg border border-base-300 text-sm z-10 ${className}`}>
            <h3 className="font-bold mb-2 text-base-content">Legend</h3>
            <div className="flex flex-col gap-2">
                {items.map((item) => (
                    <div key={item.label} className="flex items-center gap-2">
                        <span
                            className={`w-3 h-3 rounded-full border border-base-300 ${item.colorClass || ''}`}
                            style={item.color ? { backgroundColor: item.color } : undefined}
                        ></span>
                        <span className="font-medium text-base-content/80">{item.label}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};
