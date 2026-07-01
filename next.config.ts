import type { NextConfig } from 'next'

// The phone loads Biblio from the PC's LAN IP — a different origin than the
// localhost the dev server binds to. Next blocks cross-origin dev-asset requests
// by default, so list the allowed LAN host(s) here. Set them in .env, e.g.
//   LAN_DEV_ORIGINS="192.168.1.42,10.0.0.5"
// (find your IP in the `next dev` startup output: "Network: http://<ip>:3000").
// NOTE: allowedDevOrigins matches the request HOSTNAME — use bare IPs/hosts only,
// no "http://" and no ":3000" port, or the match fails and dev assets stay blocked.
const lanDevOrigins = (process.env.LAN_DEV_ORIGINS ?? '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
  },
  // Allow LAN access for phone-to-PC sync during development.
  // In production, use `next start -H 0.0.0.0` to bind to all interfaces.
  ...(lanDevOrigins.length ? { allowedDevOrigins: lanDevOrigins } : {}),
}

export default nextConfig
