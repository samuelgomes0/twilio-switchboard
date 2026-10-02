"use client"
import { DropdownMenuContent,DropdownMenuItem,DropdownMenuRoot,DropdownMenuSeparator,DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useEnvironment } from "@/features/environments/context"
import { strings } from "@/lib/strings"
import { Check,ChevronDown,Settings2 } from "lucide-react"
import Link from "next/link"
export function EnvironmentSelector() {
  const {activeEnvironment,environments,setActive}=useEnvironment()
  return <DropdownMenuRoot><DropdownMenuTrigger asChild><button type="button" className="environment-trigger" aria-label={strings.sidebar.environment}><span className="environment-dot" data-selected={!!activeEnvironment} aria-hidden="true"/><span className="truncate">{activeEnvironment?.name ?? strings.sidebar.noEnvironment}</span><ChevronDown aria-hidden="true" className="size-4 shrink-0"/></button></DropdownMenuTrigger><DropdownMenuContent align="end" className="min-w-60 max-w-[calc(100vw-2rem)]">{environments.length===0 ? <p className="px-3 py-2 text-sm text-muted-foreground">{strings.sidebar.noEnvironmentRegistered}</p> : environments.map(env=><DropdownMenuItem key={env.id} onSelect={()=>setActive(env.id)}><span className="min-w-0 flex-1 break-words">{env.name}</span>{activeEnvironment?.id===env.id && <Check aria-hidden="true" className="size-4 text-primary"/>}</DropdownMenuItem>)}<DropdownMenuSeparator/><DropdownMenuItem asChild><Link href="/settings/environments"><Settings2 aria-hidden="true" className="size-4"/>{strings.sidebar.configureEnvironments}</Link></DropdownMenuItem></DropdownMenuContent></DropdownMenuRoot>
}

