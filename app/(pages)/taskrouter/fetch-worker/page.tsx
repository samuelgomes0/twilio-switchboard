import { redirect } from "next/navigation"

export default function FetchWorkerPage() {
  redirect("/taskrouter/workers?tab=details")
}
