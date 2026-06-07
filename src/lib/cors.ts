// Permissive CORS for the LAN bridge (Module 2): the standalone scanner runs on
// a different origin (or file://) than Biblio, so the /api/books and /api/lookup
// endpoints must accept cross-origin requests. Tighten the allow-list before any
// public deployment.
export const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export function corsJson(data: unknown, init?: ResponseInit): Response {
  return Response.json(data, {
    ...init,
    headers: { ...CORS_HEADERS, ...(init?.headers ?? {}) },
  })
}

export function corsPreflight(): Response {
  return new Response(null, { status: 204, headers: CORS_HEADERS })
}
