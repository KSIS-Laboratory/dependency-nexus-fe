"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useDependencyAnalysis } from "@/hooks/useDependencyAnalysis";
import { useVulnerabilityScanning } from "@/hooks/useVulnerabilityScanning";
import { AuthService, User } from "@/lib/auth";
import { VulnerabilityAPIService } from "@/lib/vulnerability";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { ErrorMessage } from "@/components/ErrorMessage";
import { PageHeader } from "@/components/PageHeader";
import { DependencyFileCard } from "@/components/DependencyFileCard";
import { DependencySection } from "@/components/DependencySection";
import { VulnerabilitySummary } from "@/components/VulnerabilitySummary";
import { VulnerabilityCard } from "@/components/VulnerabilityCard";
import { EmptyState } from "@/components/EmptyState";
import { Package, ArrowLeft, Shield, AlertTriangle } from "lucide-react";

const isUnsupportedDependencyFile = (deps: unknown): deps is { raw_content: string } => {
  return typeof deps === "object" && deps !== null && "raw_content" in deps;
};

export default function DependenciesPage() {
  const router = useRouter();
  const params = useParams();
  const owner = params.owner as string;
  const repo = params.repo as string;
  
  const { isAuthenticated, isLoading: authLoading, githubToken, jwtToken } = useAuth();
  const { analysis, isLoading: analysisLoading, error } = useDependencyAnalysis(
    githubToken,
    owner,
    repo
  );
  const { vulnerabilities, isScanning, error: vulnError, scanPackages } = useVulnerabilityScanning(jwtToken);
  const [user, setUser] = useState<User | null>(null);
  const [showVulnerabilities, setShowVulnerabilities] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      if (isAuthenticated) {
        const userData = await AuthService.getCurrentUser();
        setUser(userData);
      }
    };
    loadUser();
  }, [isAuthenticated]);

  // Scan for vulnerabilities when analysis is loaded
  useEffect(() => {
    if (analysis && jwtToken && !isScanning && !vulnerabilities) {
      const allPackages = Object.entries(analysis.dependencies || {})
        .filter(([, deps]) => !isUnsupportedDependencyFile(deps))
        .flatMap(([filename, deps]) =>
          VulnerabilityAPIService.convertDependenciesToPackageQueries(deps, filename)
        );
      
      if (allPackages.length > 0) {
        scanPackages(allPackages);
      }
    }
  }, [analysis, jwtToken, isScanning, vulnerabilities, scanPackages]);

  // Redirect if not authenticated
  if (!authLoading && !isAuthenticated) {
    router.push("/");
    return null;
  }

  const isLoading = authLoading || analysisLoading;

  if (isLoading) {
    return <LoadingSpinner message="Analyzing dependencies..." />;
  }

  if (error) {
    return (
      <ErrorMessage
        message={error}
        onBack={() => router.push("/repositories")}
      />
    );
  }

  const dependencyEntries = Object.entries(analysis?.dependencies || {}).filter(
    ([, deps]) => !isUnsupportedDependencyFile(deps)
  );

  return (
    <div className="min-h-screen bg-base-200">
      <PageHeader user={user} showUser>
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/repositories")}
            className="btn btn-ghost btn-circle btn-sm"
            aria-label="Back to repositories"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-xl font-bold">
            {owner}/{repo}
          </h1>
        </div>
      </PageHeader>

      <main className="container mx-auto p-4 sm:p-6 lg:p-8">
        <div className="mb-6">
          <h2 className="text-3xl font-bold flex items-center gap-3 text-base-content">
            <Package className="h-8 w-8 text-primary" />
            Dependency Analysis
          </h2>
        </div>

        {/* Dependency Files Found */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4 ">
            <h3 className="text-xl font-bold flex items-center gap-3 text-base-content">
              Dependency Files
            </h3>
            <div className="badge badge-primary badge-sm">
              {Object.keys(analysis?.dependency_files || {}).length}
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Object.entries(analysis?.dependency_files || {}).map(([filename, info]) => (
              <DependencyFileCard
                key={filename}
                filename={filename}
                info={info}
              />
            ))}
          </div>
        </div>

        {/* Vulnerability Summary */}
        {vulnerabilities && vulnerabilities.total_vulnerabilities > 0 && (
          <div className="mb-8">
            <VulnerabilitySummary data={vulnerabilities} />
          </div>
        )}

        {/* Vulnerability Scan Status */}
        {isScanning && (
          <div className="alert alert-info mb-8">
            <Shield className="h-5 w-5" />
            <span>Scanning dependencies for vulnerabilities...</span>
          </div>
        )}

        {vulnError && (
          <div className="alert alert-error mb-8">
            <AlertTriangle className="h-5 w-5" />
            <span>{vulnError}</span>
          </div>
        )}

        {/* Dependencies */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold flex items-center gap-3 text-base-content">
              Dependencies
            </h3>
            {vulnerabilities && vulnerabilities.total_vulnerabilities > 0 && (
              <button
                onClick={() => setShowVulnerabilities(!showVulnerabilities)}
                className="btn btn-outline btn-sm gap-2 btn-primary"
              >
                <Shield className="h-4 w-4" />
                {showVulnerabilities ? "Hide" : "Show"} Vulnerabilities
              </button>
            )}
          </div>
          <div className="space-y-6 ">
            {dependencyEntries.map(([filename, deps]: [string, any]) => (
              <DependencySection
                key={filename}
                filename={filename}
                dependencies={deps}
              />
            ))}
          </div>
        </div>

        {/* Vulnerabilities Detail View */}
        {showVulnerabilities && vulnerabilities && vulnerabilities.total_vulnerabilities > 0 && (
          <div className="mt-8">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-3 text-base-content">
              <AlertTriangle className="h-6 w-6 text-error" />
              Vulnerability Details
            </h3>
            <div className="space-y-6">
              {vulnerabilities.results.map((result) => (
                result.vulnerability_count > 0 && (
                  <div key={result.package.name} className="space-y-3">
                    <h4 className="font-semibold text-base-content flex items-center gap-2">
                      <Package className="h-5 w-5" />
                      {result.package.name}
                      <span className="badge badge-error badge-sm">
                        {result.vulnerability_count} vulnerabilities
                      </span>
                    </h4>
                    <div className="grid gap-3 md:grid-cols-2">
                      {result.vulnerabilities.map((vuln) => (
                        <VulnerabilityCard key={vuln.id} vulnerability={vuln} />
                      ))}
                    </div>
                  </div>
                )
              ))}
            </div>
          </div>
        )}

        {Object.keys(analysis?.dependency_files || {}).length === 0 && (
          <EmptyState
            icon={Package}
            message="No dependency files found in this repository"
          />
        )}
      </main>
    </div>
  );
}
