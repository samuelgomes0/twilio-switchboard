export interface Contact {
  id: string
  name: string
  phone: string
}

const CONTACTS_KEY = "switchboard:contacts"

export function readContacts(): Contact[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(CONTACTS_KEY)
    return raw ? (JSON.parse(raw) as Contact[]) : []
  } catch {
    return []
  }
}

function writeContacts(contacts: Contact[]) {
  try {
    localStorage.setItem(CONTACTS_KEY, JSON.stringify(contacts))
  } catch {}
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
