export default function Home() {
  return (
    <div className="bg-background min-h-screen">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">RunPaceFlow</h1>
          <p className="text-muted-foreground mt-6 text-lg leading-8">现代化的跑步记录与分析平台</p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <div className="bg-primary text-primary-foreground rounded-md px-3.5 py-2.5 text-sm font-semibold shadow-sm">
              开始使用
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
