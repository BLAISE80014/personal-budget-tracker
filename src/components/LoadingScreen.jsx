import budgetTrackerLogo from '../assets/personal-budget-tracker-logo.png'

export default function LoadingScreen({ error, onRetry, retrying = false }) {
  const hasError = Boolean(error)

  return (
    <main
      className="budget-loader-screen flex min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-[#f5f8ff] px-5 py-10 text-center dark:bg-[#0b1220]"
      role={hasError ? undefined : 'status'}
      aria-live={hasError ? 'off' : 'polite'}
    >
      <div className="budget-loader-content flex w-full max-w-md flex-col items-center">
        <h1 className="sr-only">Personal Budget Tracker</h1>
        <div className="relative mb-7 flex h-64 w-64 items-center justify-center sm:h-80 sm:w-80">
          {!hasError && <span className="budget-loader-ring absolute inset-0 rounded-full" aria-hidden="true" />}
          <img
            className="relative z-10 h-[calc(100%-1rem)] w-[calc(100%-1rem)] object-contain"
            src={budgetTrackerLogo}
            alt="Personal Budget Tracker"
            fetchPriority="high"
          />
        </div>

        <p className="text-base font-medium text-slate-700 dark:text-slate-200">
          Preparing your financial dashboard...
        </p>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Managing your finances, made simple.
        </p>

        {hasError ? (
          <div className="mt-6 flex flex-col items-center gap-4" role="alert">
            <p className="max-w-sm text-sm text-red-600 dark:text-red-400">{error}</p>
            <button type="button" className="primary-button" onClick={onRetry} disabled={retrying}>
              {retrying ? 'Checking connection...' : 'Try again'}
            </button>
          </div>
        ) : (
          <span className="budget-loader-spinner mt-7" aria-hidden="true" />
        )}
      </div>
    </main>
  )
}
