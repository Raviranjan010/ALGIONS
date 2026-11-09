# Environment Variables Specification

**Document:** `docs/ENVIRONMENT_VARIABLES.md`  
**System:** ALGIONS Bus Booking Management System  

---

## 1. Environment Variable Reference

| Variable Name | Exposure | Required | Example / Format | Purpose |
| :--- | :---: | :---: | :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | Public (Client & Server) | Yes | `https://xyzproject.supabase.co` | Supabase project API gateway endpoint. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public (Client & Server) | Yes | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` | Anonymous client key for public read operations and user login. |
| `SUPABASE_SERVICE_ROLE_KEY` | **Server-Side Only** | Yes (Production) | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` | Elevated administrative key for server-side RPCs, profile provisioning, and manifests. **NEVER expose to browser bundles.** |
| `NEXT_PUBLIC_APP_URL` | Public (Client & Server) | Yes | `http://localhost:3000` or `https://algions.vercel.app` | Base application URL used for generating scannable QR verification URLs. |
| `NODE_ENV` | Server-Side Only | No | `development` / `production` / `test` | Runtime environment mode. In `production`, strict configuration assertion is active. |

---

## 2. Security Invariants

1. **No Fake / Dummy Keys in Production**:
   `src/lib/env.ts` actively validates environment variables. If `NODE_ENV === "production"` and keys contain `"dummy"` or are missing, the server fails fast on startup.
2. **Never Commit Secrets**:
   `.env.local` and `.env` are strictly excluded in `.gitignore`.
3. **Template**:
   Use `.env.example` as the canonical template when setting up new deployment environments.
