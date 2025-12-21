import { AlertTriangle, RefreshCcw, ArrowLeft } from "lucide-react";

interface ErrorMessageProps {
  message: string;
  details?: string;
  onRetry?: () => void;
  onBack?: () => void;
}

export function ErrorMessage({ message, details, onRetry, onBack }: Readonly<ErrorMessageProps>) {
  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-base-200">
      <div className="card bg-base-100 shadow-xl w-full max-w-md animate-scale-in">
        <div className="card-body items-center text-center">
          <div className="mb-4">
            <div className="p-4 rounded-full bg-error/10 text-error ring-8 ring-error/5">
              <AlertTriangle className="h-12 w-12" />
            </div>
          </div>

          <h3 className="card-title text-xl text-base-content">Something went wrong</h3>
          <p className="text-base-content/60 leading-relaxed">
            {message}
          </p>

          {details && (
            <div className="bg-base-200 rounded-lg p-4 w-full text-left border border-base-300 mt-4">
              <p className="text-xs font-mono text-base-content/70 break-all">
                {details}
              </p>
            </div>
          )}

          <div className="card-actions mt-6">
            {onRetry && (
              <button
                onClick={onRetry}
                className="btn btn-primary gap-2"
              >
                <RefreshCcw className="h-4 w-4" />
                Try Again
              </button>
            )}
            {onBack && (
              <button
                onClick={onBack}
                className="btn btn-outline gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Go Back
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
