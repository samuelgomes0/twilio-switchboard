"use client"

import { usePathname } from "next/navigation"
import * as React from "react"

export function ProgressBar() {
  const pathname = usePathname()
  const [visible, setVisible] = React.useState(false)
  const [width, setWidth] = React.useState(0)
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  React.useEffect(() => {
    // Clear any running timers from a previous navigation
    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }

    // Kick off the animation sequence
    setWidth(0)
    setVisible(true)

    // Small tick so the browser paints the 0-width bar before we jump to ~70%
    const raf = requestAnimationFrame(() => {
      setWidth(70)
    })

    // Complete and hide after the simulated load finishes
    timerRef.current = setTimeout(() => {
      setWidth(100)
      timerRef.current = setTimeout(() => {
        setVisible(false)
        setWidth(0)
      }, 300)
    }, 400)

    return () => {
      cancelAnimationFrame(raf)
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [pathname])

  if (!visible) return null

  return (
    <div
      aria-hidden
      style={{
        width: `${width}%`,
        transition: width === 0 ? "none" : "width 400ms ease, opacity 300ms ease",
        opacity: width === 100 ? 0 : 1,
      }}
      className="pointer-events-none fixed top-0 left-0 z-50 h-[2px] bg-primary"
    />
  )
}
