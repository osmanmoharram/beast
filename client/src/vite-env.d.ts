/// <reference types="vite/client" />

/**
 * The API origin, substituted at build time from PORT in the repository root
 * .env — see vite.config.ts. A constant rather than an env var because the
 * value is derived, not configured: VITE_API_URL is still the way to override
 * it, and this is only the fallback.
 */
declare const __API_URL__: string
