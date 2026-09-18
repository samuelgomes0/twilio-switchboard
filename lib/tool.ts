import type { ElementType } from "react"

export interface Tool {
  label: string
  description: string
  href: string
  icon: ElementType
  available: boolean
}
