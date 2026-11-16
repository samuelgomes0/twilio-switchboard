import { redirect } from "next/navigation"

export default function FetchWorkerPage() {
  redirect("/taskrouter/manage-workers?tab=details")
}
