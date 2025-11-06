import { Package } from "lucide-react";

interface DependencySectionProps {
  filename: string;
  dependencies: any;
}

export function DependencySection({ filename, dependencies }: DependencySectionProps) {
  const formatSectionName = (name: string) => {
    return name
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (l) => l.toUpperCase());
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
    <div className="space-y-2">
      <div role="alert" className="alert alert-warning">
        <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
        <span>Unsupported format - showing raw content preview</span>
      </div>
      <div className="mockup-code bg-base-300">
        <pre className="px-4"><code className="text-xs">{dependencies.raw_content}</code></pre>
      </div>
      <p className="text-xs opacity-60">
        Content truncated for preview
      </p>
    </div>
  );

  const renderDependencyList = (section: string, packages: any) => {
    if (typeof packages !== 'object' || Array.isArray(packages)) {
      return (
        <div className="col-span-2 mockup-code bg-base-300">
          <pre className="px-4"><code className="text-xs">{JSON.stringify(packages, null, 2)}</code></pre>
        </div>
      );
    }

    if (Object.entries(packages).length === 0) {
      return (
        <p className="col-span-2 text-sm opacity-60">
          No {section} found
        </p>
      );
    }

    return Object.entries(packages).map(([pkg, version]) => (
      <div
        key={pkg}
        className="flex items-center justify-between bg-base-200 px-3 py-2 rounded-lg hover:bg-base-300 transition-colors"
      >
        <span className="font-mono text-sm font-medium">
          {pkg}
        </span>
        <div className="badge badge-primary badge-sm">
          {String(version)}
        </div>
      </div>
    ));
  };

  const renderDependencies = () => (
    <div className="space-y-4">
      {Object.entries(dependencies).map(([section, packages]: [string, any]) => (
        <div key={section}>
          <h5 className="mb-2 flex items-center gap-2 text-sm font-semibold opacity-80">
            <span className="h-2 w-2 rounded-full bg-primary"></span>
            {formatSectionName(section)}
          </h5>
          <div className="grid gap-2 md:grid-cols-2">
            {renderDependencyList(section, packages)}
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="card bg-base-100 shadow-lg border border-base-300">
      <div className="card-body">
        <h4 className="card-title flex items-center gap-2">
          <Package className="h-5 w-5 opacity-70" />
          {filename}
        </h4>

        {dependencies.error
          ? renderError()
          : dependencies.raw_content
          ? renderRawContent()
          : renderDependencies()}
      </div>
    </div>
  );
}
