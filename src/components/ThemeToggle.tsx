'use client'

import { useEffect, useState } from 'react'

export default function ThemeToggle() {
  // null = not yet mounted (server render / first paint), avoids hydration mismatch
  const [dark, setDark] = useState<boolean | null>(null)

  useEffect(() => {
    // Sync from the .dark class applied by the inline pre-paint script.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDark(document.documentElement.classList.contains('dark'))
  }, [])

  function toggle() {
    const next = !dark
    setDark(next)
    document.documentElement.classList.toggle('dark', next)
    try {
      localStorage.setItem('theme', next ? 'dark' : 'light')
    } catch {
      // ignore storage errors (private mode etc.)
    }
  }

  const isDark = dark === true

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Light mode' : 'Dark mode'}
      className="cursor-pointer w-[44px] h-[44px] grid place-items-center rounded-[11px] border border-[color:var(--color-line)] bg-[color:var(--color-card)] text-[color:var(--color-ink)] text-[18px] leading-none transition-transform active:scale-95 hover:-translate-y-0.5"
    >
      {/* neutral until mounted to avoid hydration mismatch */}
      {dark === null ? '☾' : isDark ? '☀' : '☾'}
    </button>
  )
}
