import type { KeyboardEvent } from "react"

export function navigateSuggestions(event: KeyboardEvent<HTMLElement>) {
  if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return
  const buttons = Array.from(
    event.currentTarget.querySelectorAll<HTMLButtonElement>(
      "button:not(:disabled)"
    )
  )
  if (buttons.length === 0) return
  const current = buttons.indexOf(event.target as HTMLButtonElement)
  const next =
    event.key === "ArrowDown"
      ? (current + 1) % buttons.length
      : (current <= 0 ? buttons.length : current) - 1
  event.preventDefault()
  buttons[next].focus()
}
