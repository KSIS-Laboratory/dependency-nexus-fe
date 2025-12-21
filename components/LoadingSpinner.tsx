"use client";

export function LoadingSpinner({ message = "Loading..." }: { readonly message?: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-base-200">
      <div className="text-center space-y-6">
        <div className="relative flex items-center justify-center">
            <div className="loading loading-spinner loading-lg"></div>
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-semibold text-base-content">{message}</h3>
          <p className="text-sm text-base-content/60">
            Analyzing your dependencies...
          </p>
        </div>
      </div>
    </div>
  );
}