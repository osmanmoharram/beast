# beast client

A React SPA over the Nest API in the repository root. Vite, TypeScript, React
Router; no state library and no UI kit, so the moving parts stay visible.

## Running it

The API has to be up first — the client is only a browser talking to it.

```bash
npm run start:dev      # repository root, serves the API on PORT from .env
npm run client:dev     # repository root, serves this app on :5173
```

`VITE_API_URL` overrides the whole base URL, `/api` prefix included; it
defaults to localhost on the `PORT` that the repository root `.env` gives the
API, read at build time by `vite.config.ts`. Copy `.env.example` to `.env` to
point it somewhere else. CORS is already open on the API, so no proxy is
configured.

## Layout

| Path | What lives there |
| --- | --- |
| `src/api/` | `client.ts` is the fetch wrapper — auth header, error shape, query strings. `resources.ts` is one function per endpoint. `types.ts` mirrors the API's payloads. |
| `src/auth/` | Token storage, the session context, and the route guard. |
| `src/hooks/` | `useAsync` (request + loading/error state + cancellation), `useDebounced`. |
| `src/pages/` | One component per route. |
| `src/components/` | Layout, pagination, avatar, form field, messages. |

## Two things worth knowing

**Every route needs a session.** The API's `AuthGuard` is global and only
`/auth/register` and `/auth/login` are `@Public()`, so reads are guarded too.
There is deliberately no signed-out browsing: it could only ever render a 401.
Making reads public is a server change, and the routing here would follow it.

**The token is in `localStorage`.** Any script on the page can read it, so an
XSS bug is a stolen session. That is the accepted trade for a bearer-token API
with no refresh flow; the fix is an httpOnly cookie, which is server work.

## Known lint warnings

Three `set-state-in-effect` warnings from oxlint, all the same shape: local
form state seeded from data that arrives asynchronously. The one in
`AuthContext` is a false positive — reading a stored token and asking the API
who it belongs to is synchronising with an external system, which is what
effects are for. The two in the form pages could be removed by keying the form
on the loaded record so it mounts with the right values instead of adjusting
after; left as is for now.
