interface LoadingSpinnerProps {
  readonly message?: string;
}

export function LoadingSpinner({ message = "Loading..." }: LoadingSpinnerProps) {
  return (
    <output
      className="fixed inset-0 z-50 flex items-center justify-center bg-base-300/80 backdrop-blur-md px-4"
      aria-live="polite"
    >
      <div className="card w-full max-w-md border border-base-200 bg-base-100/95 shadow-2xl">
        <div className="card-body items-center gap-6 text-center">
          <div className="relative flex h-24 w-24 items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-linear-to-br from-primary/40 via-secondary/30 to-accent/20 blur-2xl opacity-80 animate-pulse" />
            <div className="absolute inset-2 rounded-full border-2 border-dashed border-primary/50 animate-spin"></div>
            <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-base-100 shadow-lg">
              <span className="loading loading-infinity loading-lg text-primary" />
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-xl font-semibold text-base-content">{message}</h3>
            <p className="text-sm text-base-content/70">
              Please wait while we prepare your workspace. This won't take long.
            </p>
          </div>
        </div>
      </div>
    </output>
  );
}
