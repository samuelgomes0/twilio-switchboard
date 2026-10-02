import { X } from "lucide-react"
import { AlertDialog } from "radix-ui"
import * as React from "react"

import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

function AlertDialogRoot(props: React.ComponentProps<typeof AlertDialog.Root>) {
  return <AlertDialog.Root data-slot="alert-dialog" {...props} />
}

function AlertDialogPortal(
  props: React.ComponentProps<typeof AlertDialog.Portal>
) {
  return <AlertDialog.Portal {...props} />
}

function AlertDialogOverlay({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialog.Overlay>) {
  return (
    <AlertDialog.Overlay
      data-slot="alert-dialog-overlay"
      className={cn(
        "fixed inset-0 z-[var(--layer-dialog)] bg-black/50",
        "data-[state=closed]:animate-out data-[state=open]:animate-in",
        "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
        className
      )}
      {...props}
    />
  )
}

function AlertDialogContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof AlertDialog.Content>) {
  return (
    <AlertDialogPortal>
      <AlertDialogOverlay />
      <AlertDialog.Content
        data-slot="alert-dialog-content"
        className={cn(
          "fixed top-1/2 left-1/2 z-[var(--layer-dialog)] max-h-[calc(100svh-2rem)] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto",
          "rounded-xl bg-card p-6 shadow-[var(--shadow-overlay)]",
          "data-[state=closed]:animate-out data-[state=open]:animate-in",
          "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
          "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
          "data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%]",
          "data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]",
          className
        )}
        {...props}
      >
        {children}
      </AlertDialog.Content>
    </AlertDialogPortal>
  )
}

function AlertDialogHeader({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-dialog-header"
      className={cn("flex flex-col gap-2 text-left", className)}
      {...props}
    />
  )
}

function AlertDialogFooter({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-dialog-footer"
      className={cn(
        "mt-6 flex flex-wrap items-center justify-end gap-2",
        className
      )}
      {...props}
    />
  )
}

function AlertDialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialog.Title>) {
  return (
    <AlertDialog.Title
      data-slot="alert-dialog-title"
      className={cn("text-xl font-semibold tracking-tight", className)}
      {...props}
    />
  )
}

function AlertDialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialog.Description>) {
  return (
    <AlertDialog.Description
      data-slot="alert-dialog-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

function AlertDialogCancel({
  className,
  children,
  ...props
}: React.ComponentProps<typeof AlertDialog.Cancel>) {
  return (
    <AlertDialog.Cancel
      data-slot="alert-dialog-cancel"
      className={cn(
        buttonVariants({ variant: "outline" }),
        "gap-2 [&_svg]:size-3.5",
        className
      )}
      {...props}
    >
      <X aria-hidden="true" />
      {children}
    </AlertDialog.Cancel>
  )
}

function AlertDialogAction({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialog.Action>) {
  return (
    <AlertDialog.Action
      data-slot="alert-dialog-action"
      className={cn(buttonVariants(), className)}
      {...props}
    />
  )
}

export {
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogRoot,
  AlertDialogTitle,
}
