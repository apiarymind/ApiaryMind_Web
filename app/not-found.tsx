export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-light-pattern dark:bg-dark-pattern">
      <div className="text-center p-8 bg-white/5 dark:bg-black/20 backdrop-blur-md rounded-xl border border-white/10">
        <h2 className="text-4xl font-bold text-amber-500 mb-4">404</h2>
        <p className="text-xl text-text-dark dark:text-white/80 mb-6">
          Strona nie została znaleziona
        </p>
        <a
          href="/"
          className="inline-block px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-colors"
        >
          Wróć do strony głównej
        </a>
      </div>
    </div>
  )
}









