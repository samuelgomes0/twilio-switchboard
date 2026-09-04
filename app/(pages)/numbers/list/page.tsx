import type { Metadata } from "next"

import { ListNumbersForm } from "@/features/numbers/components/list-numbers-form"
import { strings } from "@/lib/strings"

export const metadata: Metadata = {
  title: strings.numbers.list.metadata.title,
  description: strings.numbers.list.metadata.description,
}

export default function ListNumbersPage() {
  return <ListNumbersForm />
}
