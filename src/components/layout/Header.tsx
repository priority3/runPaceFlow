'use client'

import Image from 'next/image'

import { ThemeToggle } from '@/components/ui/ThemeToggle'

export function Header() {
  return (
    <header className="bg-system-background/88 sticky top-0 z-50 w-full shadow-[0_8px_30px_rgba(24,33,47,0.045)] backdrop-blur-xl dark:shadow-[0_8px_30px_rgba(0,0,0,0.22)]">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <a
          href="#overview"
          className="focus-visible:outline-blue flex items-center gap-2.5 focus-visible:outline-2 focus-visible:outline-offset-2"
          aria-label="返回训练总览"
        >
          <Image
            src="/logo-mark.png?v=1"
            alt="RunPaceFlow"
            width={40}
            height={40}
            priority
            unoptimized
            className="h-11 w-11 shrink-0 bg-transparent object-contain dark:invert"
          />
          <div className="flex items-baseline gap-2">
            <h1 className="font-display text-label text-[17px] font-semibold">RunPaceFlow</h1>
            <span className="font-data text-tertiary-label hidden text-[10px] sm:inline">
              TRAINING OS
            </span>
          </div>
        </a>

        <div className="flex items-center gap-2 sm:gap-4">
          <nav
            className="text-secondary-label hidden items-center gap-1 text-sm md:flex"
            aria-label="首页导航"
          >
            <a
              href="#training-volume"
              className="hover:text-label focus-visible:outline-blue rounded-md px-3 py-2 transition-colors focus-visible:outline-2"
            >
              训练量
            </a>
            <a
              href="#training-rhythm"
              className="hover:text-label focus-visible:outline-blue rounded-md px-3 py-2 transition-colors focus-visible:outline-2"
            >
              节奏
            </a>
            <a
              href="#activity-log"
              className="hover:text-label focus-visible:outline-blue rounded-md px-3 py-2 transition-colors focus-visible:outline-2"
            >
              记录
            </a>
          </nav>
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
