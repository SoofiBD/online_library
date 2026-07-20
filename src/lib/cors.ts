// CORS for the LAN bridge (Module 2): the standalone scanner/phone client runs
// on a different origin than Biblio's Next server, so /api/* must accept
// cross-origin requests from that specific origin — but only that origin, not
// `*`. Two sources feed the allow-list: LAN_DEV_ORIGINS (bare hosts, same env
// var next.config.ts uses for allowedDevOrigins — dev-only, LAN scanner) and
// ALLOWED_ORIGINS (full origins incl. scheme — production, e.g. the deployed
// scanner's real domain). Plus localhost for same-machine dev either way.
const DEV_PORT = '3000'

function bareHostsToOrigins(hosts: string[]): string[] {
  return hosts.flatMap((host) => [`http://${host}:${DEV_PORT}`, `https://${host}:${DEV_PORT}`])
}

function splitEnvList(value: string | undefined): string[] {
  return (value ?? '')
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean)
}

const LAN_DEV_HOSTS = splitEnvList(process.env.LAN_DEV_ORIGINS)
const PRODUCTION_ORIGINS = splitEnvList(process.env.ALLOWED_ORIGINS)

const ALLOWED_ORIGINS = new Set<string>([
  `http://localhost:${DEV_PORT}`,
  `http://127.0.0.1:${DEV_PORT}`,
  ...bareHostsToOrigins(LAN_DEV_HOSTS),
  ...PRODUCTION_ORIGINS,
])

function isAllowedOrigin(origin: string | null): origin is string {
  return origin !== null && ALLOWED_ORIGINS.has(origin)
}

function corsHeadersFor(origin: string | null): Record<string, string> {
  const headers: Record<string, string> = {
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, x-device-id',
    Vary: 'Origin',
  }
  if (isAllowedOrigin(origin)) {
    headers['Access-Control-Allow-Origin'] = origin
  }
  return headers
}

export function corsJson(request: Request, data: unknown, init?: ResponseInit): Response {
  const origin = request.headers.get('origin')
  return Response.json(data, {
    ...init,
    headers: { ...corsHeadersFor(origin), ...(init?.headers ?? {}) },
  })
}

export function corsPreflight(request: Request): Response {
  const origin = request.headers.get('origin')
  return new Response(null, { status: 204, headers: corsHeadersFor(origin) })
}

export function corsHeadersForRequest(request: Request): Record<string, string> {
  return corsHeadersFor(request.headers.get('origin'))
}

/**
 * CSRF guard for mutating routes: a browser always sends `Origin` on
 * cross-origin (and modern same-origin) fetches, so if it's present it must be
 * on the allow-list. Missing Origin (native/CLI clients, e.g. the paired
 * phone app) is allowed through — device-header auth covers that path.
 */
export function requireValidOrigin(request: Request): Response | null {
  const origin = request.headers.get('origin')
  if (origin !== null && !isAllowedOrigin(origin)) {
    return corsJson(request, { error: 'Origin not allowed' }, { status: 403 })
  }
  return null
}
