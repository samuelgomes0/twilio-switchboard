import type { Metadata } from "next"

import { CreateAddressConfigForm } from "@/features/flex/components/create-address-config-form"
import { strings } from "@/lib/strings"

export const metadata: Metadata = {
  title: strings.flex.createAddressConfig.metadata.title,
  description: strings.flex.createAddressConfig.metadata.description,
}

export default function CreateAddressConfigPage() {
  return <CreateAddressConfigForm />
}
