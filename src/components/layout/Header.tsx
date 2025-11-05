/**
 * Header Component
 *
 * Application header with title and navigation
 */

export function Header() {
  return (
    <header className="border-separator bg-systemBackground/95 supports-[backdrop-filter]:bg-systemBackground/60 sticky top-0 z-50 w-full border-b backdrop-blur">
      <div className="container flex h-14 max-w-screen-2xl items-center">
        <div className="flex items-center gap-2">
          <h1 className="text-label text-xl font-bold">RunPaceFlow</h1>
        </div>
      </div>
    </header>
  )
}
