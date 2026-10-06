import { PAGE_ROUTES } from "./lib/route-migrations.mjs"

/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ["twilio"],
  async redirects() {
    return Object.entries(PAGE_ROUTES).map(([source, destination]) => ({
      source,
      destination,
      permanent: true,
    }))
  },
}

export default nextConfig
