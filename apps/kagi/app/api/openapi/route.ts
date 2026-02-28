import { buildOpenApiSpec } from '@/lib/openapi-spec'

// Public endpoint — no auth required (just the API spec)
export function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  return Response.json(buildOpenApiSpec(baseUrl), {
    headers: { 'Cache-Control': 'public, max-age=3600' }
  })
}
