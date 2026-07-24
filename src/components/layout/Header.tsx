'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'

import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { cn } from '@/lib/utils'

export function Header() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header className={cn('surface-header sticky top-0 z-50 w-full', scrolled && 'is-scrolled')}>
      <div className="mx-auto flex h-12 max-w-[82rem] items-center justify-between px-5 sm:px-7 lg:px-10">
        <a
          href="#overview"
          className="focus-visible:outline-accent flex items-center gap-2 focus-visible:outline-2 focus-visible:outline-offset-2"
          aria-label="返回训练总览"
        >
          <Image
            src="/logo-mark.png?v=1"
            alt="RunPaceFlow"
            width={28}
            height={28}
            priority
            unoptimized
            className="h-7 w-7 shrink-0 bg-transparent object-contain opacity-90 dark:invert"
          />
          <div className="flex items-baseline gap-2">
            <h1 className="font-display text-label text-sm font-medium tracking-tight">
              RunPaceFlow
            </h1>
            <span className="font-data text-tertiary-label hidden text-[10px] tracking-[0.08em] sm:inline">
              TRAINING OS
            </span>
          </div>
        </a>

        <div className="flex items-center gap-0.5 sm:gap-1">
          <nav
            className="text-secondary-label hidden items-center gap-0.5 text-[13px] md:flex"
            aria-label="首页导航"
          >
            <a
              href="#training-volume"
              className="hover:text-label focus-visible:outline-accent rounded-md px-2.5 py-1.5 transition-colors focus-visible:outline-2"
            >
              训练量
            </a>
            <a
              href="#training-rhythm"
              className="hover:text-label focus-visible:outline-accent rounded-md px-2.5 py-1.5 transition-colors focus-visible:outline-2"
            >
              节奏
            </a>
            <a
              href="#activity-log"
              className="hover:text-label focus-visible:outline-accent rounded-md px-2.5 py-1.5 transition-colors focus-visible:outline-2"
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
