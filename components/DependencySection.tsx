import { Package, ChevronDown, ChevronUp, AlertCircle, FileText, Box } from "lucide-react";
import { useState } from "react";

type DependencyRecord = {
  error?: string;
  type?: string;
  raw_content?: string;
  [section: string]: unknown;
};

interface DependencySectionProps {
  readonly filename: string;
  readonly dependencies: Readonly<DependencyRecord>;
}

export function DependencySection({ filename, dependencies }: DependencySectionProps) {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  const isRecord = (value: unknown): value is Record<string, unknown> => {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const formatSectionName = (name: string) => {
    return name
      .replaceAll('_', ' ')
      .replaceAll(/\b\w/g, (l) => l.toUpperCase());
  };

  const renderError = () => (
    <div role="alert" className="alert alert-error bg-error/10 border-error/20 text-error-content">
      <AlertCircle className="h-5 w-5" />
      <div>
        <div className="font-bold">Failed to parse file</div>
        <div className="text-sm opacity-90">{dependencies.error}</div>
        {dependencies.type && (
          <div className="text-xs mt-1 opacity-75 font-mono">Type: {dependencies.type}</div>
        )}
      </div>
    </div>
  );

  const renderRawContent = () => (
    <div className="space-y-3">
      <div role="alert" className="alert alert-warning bg-warning/10 border-warning/20 text-warning-content">
        <FileText className="h-5 w-5" />
        <span className="font-medium">Unsupported format - showing raw content preview</span>
      </div>
      <div className="mockup-code bg-base-300/50 backdrop-blur-sm border border-base-content/10 text-sm shadow-inner">
        <pre className="px-5 py-4"><code className="leading-relaxed font-mono text-base-content/80">{dependencies.raw_content}</code></pre>
      </div>
      <p className="text-xs text-center text-base-content/50 italic">
        Content truncated for preview
      </p>
    </div>
  );

  const renderDependencyList = (section: string, packages: unknown, isExpanded: boolean, onToggle: () => void) => {
    if (!isRecord(packages)) {
      return (
        <div className="col-span-2 mockup-code bg-base-300/30 border border-base-content/5 text-xs">
          <pre className="px-4 py-3"><code>{JSON.stringify(packages, null, 2)}</code></pre>
        </div>
      );
    }

    const entries = Object.entries(packages);
    const totalCount = entries.length;

    if (totalCount === 0) {
      return (
        <div className="p-4 text-center text-base-content/40 italic bg-base-200/30 rounded-lg border border-base-200 border-dashed">
          No {section} found
        </div>
      );
    }

    const INITIAL_DISPLAY_COUNT = 5;
    const displayedEntries = isExpanded ? entries : entries.slice(0, INITIAL_DISPLAY_COUNT);
    const hasMore = totalCount > INITIAL_DISPLAY_COUNT;

    return (
      <div className="space-y-2">
        <div className="grid gap-2 sm:grid-cols-2">
          {displayedEntries.map(([pkg, version]) => (
            <div
              key={pkg}
              className="group flex items-center justify-between gap-3 rounded-xl bg-base-100 border border-base-200 p-3 transition-all hover:border-primary/30 hover:shadow-sm hover:bg-base-100/80"
            >
              <div className="flex items-center gap-2 min-w-0">
                <div className="p-1.5 rounded-md bg-primary/5 text-primary group-hover:bg-primary/10 transition-colors">
                  <Box className="h-3.5 w-3.5" />
                </div>
                <span className="font-medium text-sm text-base-content truncate" title={pkg}>
                  {pkg}
                </span>
              </div>
              <span className="badge badge-sm badge-ghost font-mono text-xs opacity-70 group-hover:opacity-100 transition-opacity">
                {String(version).trim()}
              </span>
            </div>
          ))}
        </div>

        {hasMore && (
          <button
            onClick={onToggle}
            className="btn btn-ghost btn-sm w-full gap-2 mt-2 text-base-content/60 hover:text-primary hover:bg-primary/5"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="h-4 w-4" />
                Show Less
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4" />
                Show All ({totalCount - INITIAL_DISPLAY_COUNT} more)
              </>
            )}
          </button>
        )}
      </div>
    );
  };

  const renderDependencies = () => (
    <div className="space-y-6">
      {Object.entries(dependencies).map(([section, packages]: [string, any]) => {
        const isExpanded = expandedSections[section] || false;
        const count = isRecord(packages) ? Object.keys(packages).length : 0;

        return (
          <div key={section} className="bg-base-200/30 rounded-2xl p-1">
            <div className="px-3 py-2 flex items-center justify-between">
              <h5 className="flex items-center gap-2.5 text-sm font-bold text-base-content uppercase tracking-wider opacity-80">
                <span className="h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(var(--p),0.6)]"></span>
                {formatSectionName(section)}
              </h5>
              {count > 0 && (
                <span className="badge badge-sm badge-ghost">{count}</span>
              )}
            </div>
            <div className="p-2">
              {renderDependencyList(section, packages, isExpanded, () => toggleSection(section))}
            </div>
          </div>
        );
      })}
    </div>
  );

  let content;

  if (dependencies.error) {
    content = renderError();
  } else if (dependencies.raw_content) {
    content = renderRawContent();
  } else {
    content = renderDependencies();
  }

  return (
    <div className="card bg-base-100/60 backdrop-blur-sm shadow-sm border border-base-200 overflow-hidden">
      <div className="card-body p-0">
        <div className="px-6 py-4 border-b border-base-200 bg-base-100/50 flex items-center justify-between">
          <h4 className="font-bold text-base-content flex items-center gap-2.5">
            <div className="p-2 bg-primary/10 rounded-lg text-primary">
              <Package className="h-5 w-5" />
            </div>
            {filename}
          </h4>
        </div>
        <div className="p-6">
          {content}
        </div>
      </div>
    </div>
  );
}
