/**
 * Sentry instrumentation file for Next.js.
 *
 * This file is auto-imported by Next.js when @sentry/nextjs is installed.
 * Until the package is added, this is a no-op placeholder that documents
 * the intended integration point.
 *
 * To activate:
 *   1. npm install @sentry/nextjs
 *   2. npx @sentry/wizard@latest -i nextjs
 *   3. Set SENTRY_DSN in .env (or SENTRY_AUTH_TOKEN for upload)
 *   4. Uncomment the exports below
 */

// export async function register() {
//   if (process.env.NEXT_RUNTIME === 'nodejs') {
//     const Sentry = await import('@sentry/nextjs')
//     Sentry.init({
//       dsn: process.env.SENTRY_DSN,
//       environment: process.env.VERCEL_ENV || process.env.NODE_ENV,
//       tracesSampleRate: 0.1,
//       replaysSessionSampleRate: 0,
//       replaysOnErrorSampleRate: 1.0,
//     })
//   }
// }
