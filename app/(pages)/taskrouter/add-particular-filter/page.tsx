import type { Metadata } from "next"

import { AddParticularFilterForm } from "@/features/taskrouter/components/add-particular-filter-form"

export const metadata: Metadata = {
  title: "Adicionar Filtro Particular | Switchboard",
  description:
    "Insere o filtro 'Particular' nos workflows indicados do TaskRouter.",
}

export default function AddParticularFilterPage() {
  return <AddParticularFilterForm />
}
