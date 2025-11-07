import { Package, ChevronDown, ChevronUp } from "lucide-react";
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
    <div role="alert" className="alert alert-error">
      <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
      <div>
        <div className="font-bold">{dependencies.error}</div>
        {dependencies.type && (
          <div className="text-sm">File type: {dependencies.type}</div>
        )}
      </div>
    </div>
  );

  const renderRawContent = () => (
    <div className="space-y-1">
      <div role="alert" className="alert alert-warning">
        <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
        <span>Unsupported format - showing raw content preview</span>
      </div>
      <div className="mockup-code bg-base-200 border border-base-300 p-2 place-items-start [&>pre]:px-3 [&>pre]:py-2 [&>pre]:leading-tight">
        <pre className="text-xs text-base-content whitespace-pre-wrap wrap-break-word"><code className="leading-tight">{dependencies.raw_content}</code></pre>
      </div>
      <p className="text-xs text-base-content opacity-60">
        Content truncated for preview
      </p>
    </div>
  );

  const renderDependencyList = (section: string, packages: unknown, isExpanded: boolean, onToggle: () => void) => {
    if (!isRecord(packages)) {
      return (
        <div className="col-span-2 mockup-code bg-base-200 border border-base-300 p-2 place-items-start [&>pre]:px-3 [&>pre]:py-2 [&>pre]:leading-tight">
          <pre className="text-xs text-base-content whitespace-pre-wrap wrap-break-word"><code className="leading-tight">{JSON.stringify(packages, null, 2)}</code></pre>
        </div>
      );
    }

    const entries = Object.entries(packages);
    const totalCount = entries.length;

    if (totalCount === 0) {
      return (
        <p className="col-span-2 text-sm text-base-content opacity-60">
          No {section} found
        </p>
      );
    }

    const INITIAL_DISPLAY_COUNT = 5;
    const displayedEntries = isExpanded ? entries : entries.slice(0, INITIAL_DISPLAY_COUNT);
    const hasMore = totalCount > INITIAL_DISPLAY_COUNT;

    return (
      <>
        {displayedEntries.map(([pkg, version]) => (
          <div
            key={pkg}
            className="flex items-start justify-between gap-3 rounded-lg bg-base-200 p-2.5 transition-colors hover:bg-base-300"
          >
            <span className="font-mono text-xs font-medium text-base-content wrap-break-word flex-1 min-w-0 leading-relaxed">
              {pkg}
            </span>
            <span className="badge badge-primary badge-sm shrink-0 px-2.5 py-1 text-xs font-medium leading-tight">
              {String(version).trim()}
            </span>
          </div>
        ))}
        {hasMore && (
          <button
            onClick={onToggle}
            className="btn btn-outline btn-sm w-full gap-2 mt-2"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="h-4 w-4" />
                Show Less
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4" />
                Show All ({totalCount} dependencies)
              </>
            )}
          </button>
        )}
      </>
    );
  };

  const renderDependencies = () => (
    <div className="space-y-4">
      {Object.entries(dependencies).map(([section, packages]: [string, any]) => {
        const isExpanded = expandedSections[section] || false;
        
        return (
          <div key={section}>
            <h5 className="mb-2 flex items-center gap-2 text-sm font-semibold text-base-content">
              <span className="h-2 w-2 rounded-full bg-primary"></span>
              {formatSectionName(section)}
            </h5>
            <div className="flex flex-col gap-1.5">
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
    <div className="card bg-base-100 shadow-lg border border-base-300">
      <div className="card-body">
        <h4 className="card-title text-base-content flex items-center gap-2">
          <Package className="h-5 w-5 text-primary" />
          <span className="text-sm text-base-content opacity-70" />
          {filename}
        </h4>
        <span className="text-sm text-base-content">{content}</span>
      </div>
    </div>
  );
}
