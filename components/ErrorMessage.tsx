interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
  onBack?: () => void;
}

export function ErrorMessage({ message, onRetry, onBack }: ErrorMessageProps) {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div role="alert" className="alert alert-error">
          <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          <div>
            <h3 className="font-bold">Error</h3>
            <div className="text-sm">{message}</div>
          </div>
        </div>
        <div className="mt-4 flex gap-2 justify-center">
          {onRetry && (
            <button
              onClick={onRetry}
              className="btn btn-primary"
            >
              Retry
            </button>
          )}
          {onBack && (
            <button
              onClick={onBack}
              className="btn btn-neutral"
            >
              Go Back
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
