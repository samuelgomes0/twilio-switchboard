import { redirect } from "next/navigation"

export default function UpdateWorkerFeaturePage() {
  redirect("/taskrouter/workers?tab=features")
}
