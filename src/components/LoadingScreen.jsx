import budgetTrackerLogo from '../assets/personal-budget-tracker-logo.png'

export default function LoadingScreen({ error, onRetry, retrying = false }) {
  const hasError = Boolean(error)

  return (
    <main
      className="budget-loader-screen flex min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-[#f5f8ff] px-5 py-10 text-center dark:bg-[#0b1220]"
      role={hasError ? undefined : 'status'}
      aria-live={hasError ? 'off' : 'polite'}
    >
      <div className="budget-loader-content flex w-full max-w-sm flex-col items-center">
        <h1 className="sr-only">Personal Budget Tracker</h1>
        <div className="relative mb-4 flex h-40 w-40 items-center justify-center sm:h-48 sm:w-48">
          {!hasError && <span className="budget-loader-ring absolute inset-0 rounded-full" aria-hidden="true" />}
          <img
            className="relative z-10 h-[calc(100%-1rem)] w-[calc(100%-1rem)] object-contain"
            src={budgetTrackerLogo}
            alt="Personal Budget Tracker"
            fetchPriority="high"
          />
        </div>

        <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
          Preparing your financial dashboard...
        </p>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Managing your finances, made simple.
        </p>

        {hasError ? (
          <div className="mt-4 flex flex-col items-center gap-3" role="alert">
            <p className="max-w-sm text-sm text-red-600 dark:text-red-400">{error}</p>
            <button type="button" className="primary-button" onClick={onRetry} disabled={retrying}>
              {retrying ? 'Checking connection...' : 'Try again'}
            </button>
          </div>
        ) : (
          <span className="budget-loader-spinner mt-4" aria-hidden="true" />
        )}
      </div>
    </main>
  )
}
