/**
 * Header Component
 *
 * Application header with title and navigation
 */

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-separator bg-systemBackground/95 backdrop-blur supports-[backdrop-filter]:bg-systemBackground/60">
      <div className="container flex h-14 max-w-screen-2xl items-center">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold text-label">RunPaceFlow</h1>
        </div>
      </div>
    </header>
  )
}
