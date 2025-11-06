/**
 * Header Component
 *
 * Minimal, modern header design
 */

export function Header() {
  return (
    <header className="border-separator bg-background/80 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 w-full border-b backdrop-blur-xl">
      <div className="container mx-auto flex h-20 max-w-[1600px] items-center px-8">
        <div className="flex items-center gap-4">
          <div className="bg-primary flex size-12 items-center justify-center rounded-2xl">
            <span className="text-2xl">🏃</span>
          </div>
          <h1 className="text-text text-2xl font-bold tracking-tight">RunPaceFlow</h1>
        </div>
      </div>
    </header>
  )
}
