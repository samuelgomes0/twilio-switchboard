import type { Metadata } from "next"

import { ContactsManager } from "@/features/contacts/components/contacts-manager"
import { strings } from "@/lib/strings"

export const metadata: Metadata = {
  title: strings.contacts.manager.metadata.title,
  description: strings.contacts.manager.metadata.description,
}

export default function ContactsPage() {
  return <ContactsManager />
}
