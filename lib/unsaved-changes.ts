import { strings } from "@/lib/strings"
const pending = new Set<symbol>()
export function confirmDiscardChanges(): boolean {
  return (
    !pending.size ||
    typeof window === "undefined" ||
    window.confirm(strings.operationReview.discard)
  )
}
function beforeUnload(event: BeforeUnloadEvent) {
  if (!pending.size) return
  event.preventDefault()
  event.returnValue = ""
}
function navigate(event: MouseEvent) {
  if (
    event.defaultPrevented ||
    event.button !== 0 ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey
  )
    return
  const link =
    event.target instanceof Element ? event.target.closest("a[href]") : null
  if (
    !(link instanceof HTMLAnchorElement) ||
    link.hasAttribute("download") ||
    (link.target && link.target !== "_self")
  )
    return
  const destination = new URL(link.href)
  if (
    destination.pathname === location.pathname &&
    destination.search === location.search &&
    destination.origin === location.origin
  )
    return
  if (!confirmDiscardChanges()) {
    event.preventDefault()
    event.stopPropagation()
  }
}
export function registerUnsavedChanges(): () => void {
  const id = Symbol()
  if (!pending.size && typeof window !== "undefined") {
    window.addEventListener("beforeunload", beforeUnload)
    document.addEventListener("click", navigate, true)
  }
  pending.add(id)
  return () => {
    pending.delete(id)
    if (!pending.size && typeof window !== "undefined") {
      window.removeEventListener("beforeunload", beforeUnload)
      document.removeEventListener("click", navigate, true)
    }
  }
}
