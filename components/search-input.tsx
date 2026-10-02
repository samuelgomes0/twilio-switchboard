"use client"

import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { Search } from "lucide-react"
import { useId, type ComponentProps } from "react"

export function SearchInput({
  className,
  ...props
}: ComponentProps<typeof Input>) {
  const generatedId = useId()
  const id = props.id ?? generatedId
  return (
    <div className="search-input-container">
      {props["aria-label"] && !props.id && (
        <label htmlFor={id} className="sr-only">
          {props["aria-label"]}
        </label>
      )}
      <Search aria-hidden="true" className="search-input-icon" />
      <Input
        type="search"
        {...props}
        id={id}
        className={cn("search-control search-input", className)}
      />
    </div>
  )
}
