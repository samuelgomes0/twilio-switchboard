import { readStorageJson, writeStorageJson } from "@/lib/browser-storage"

export interface Contact {
  id: string
  name: string
  phone: string
}

const CONTACTS_KEY = "switchboard:contacts"

export function readContacts(): Contact[] {
  return readStorageJson(
    CONTACTS_KEY,
    (value): value is Contact[] =>
      Array.isArray(value) &&
      value.every(
        (contact) =>
          typeof contact === "object" &&
          contact !== null &&
          typeof contact.id === "string" &&
          contact.id.length > 0 &&
          typeof contact.name === "string" &&
          contact.name.trim().length > 0 &&
          typeof contact.phone === "string" &&
          contact.phone.trim().length > 0
      ),
    []
  )
}

function writeContacts(contacts: Contact[]) {
  writeStorageJson(CONTACTS_KEY, contacts)
}

export function addContact(data: Omit<Contact, "id">): Contact {
  const contact: Contact = { ...data, id: crypto.randomUUID() }
  writeContacts([contact, ...readContacts()])
  return contact
}

export function updateContact(id: string, data: Omit<Contact, "id">) {
  writeContacts(
    readContacts().map((c) => (c.id === id ? { ...c, ...data } : c))
  )
}

export function deleteContact(id: string) {
  writeContacts(readContacts().filter((c) => c.id !== id))
}
