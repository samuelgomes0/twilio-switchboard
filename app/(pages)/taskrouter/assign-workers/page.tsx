import { redirect } from "next/navigation"

export default function AssignWorkersPage() {
  redirect("/taskrouter/workers?tab=skills")
}
