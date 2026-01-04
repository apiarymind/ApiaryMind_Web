'use client'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-light-pattern dark:bg-dark-pattern">
      <div className="text-center p-8 bg-white/5 dark:bg-black/20 backdrop-blur-md rounded-xl border border-white/10">
        <h2 className="text-2xl font-bold text-red-500 mb-4">Wystąpił błąd</h2>
        <p className="text-text-dark dark:text-white/80 mb-6">
          {error.message || 'Nieoczekiwany błąd'}
        </p>
        <button
          onClick={reset}
          className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-colors"
        >
          Spróbuj ponownie
        </button>
      </div>
    </div>
  )
}




