import type { Metadata } from "next"

import { AddParticularFilterForm } from "@/features/taskrouter/components/add-particular-filter-form"
import { strings } from "@/lib/strings"

export const metadata: Metadata = {
  title: strings.taskrouter.addParticularFilter.metadata.title,
  description: strings.taskrouter.addParticularFilter.metadata.description,
}

export default function AddParticularFilterPage() {
  return <AddParticularFilterForm />
}
