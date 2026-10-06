import { redirect } from "next/navigation"

export default function AssignWorkersPage() {
  redirect("/taskrouter/manage-workers?tab=skills")
}
