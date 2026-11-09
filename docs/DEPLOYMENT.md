# Deployment Guide: Vercel & Supabase

**Document:** `docs/DEPLOYMENT.md`  
**System:** ALGIONS Bus Booking Management System  

---

## 1. Supabase Setup

1. **Create Supabase Project**:
   - Navigate to [Supabase Dashboard](https://supabase.com/dashboard) and create project `algions-bus-booking`.
   - Select closest region (e.g. `ap-south-1` Mumbai).
2. **Execute Migrations in Order**:
   In the **SQL Editor**, run:
   - File 1: `supabase/migrations/20260201000000_initial_schema.sql` (Creates 15 tables, constraints, partial unique index, RLS).
   - File 2: `supabase/migrations/20260201000001_booking_engine_rpc.sql` (Creates `create_booking_atomic`, `cancel_booking_atomic`, `verify_ticket_by_pnr`).
   - File 3: `supabase/seed.sql` (Seeds operators, fleet, routes, trips, seats).
3. **Retrieve API Credentials**:
   - Under **Project Settings -> API**, copy:
     - `Project URL` -> `NEXT_PUBLIC_SUPABASE_URL`
     - `anon / public key` -> `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     - `service_role key` -> `SUPABASE_SERVICE_ROLE_KEY` (Keep secret!).

---

## 2. Vercel Deployment

1. **Import Repository**:
   - Connect your GitHub account at [Vercel](https://vercel.com/new) and import `Raviranjan010/ALGIONS`.
2. **Configure Environment Variables**:
   Under **Project Settings -> Environment Variables**, configure:
   - `NEXT_PUBLIC_SUPABASE_URL` = `https://your-project.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = `<your-anon-key>`
   - `SUPABASE_SERVICE_ROLE_KEY` = `<your-service-role-key>`
   - `NEXT_PUBLIC_APP_URL` = `https://<your-project>.vercel.app`
3. **Deploy**:
   Click **Deploy**. Next.js will compile the 28 routes and deploy edge/serverless lambdas.

---

## 3. Post-Deployment Credential Rotation

1. Navigate to **Authentication -> Users** in the Supabase Dashboard.
2. For each demo account (`passenger@algions.com`, `operator@royalexpress.in`, `admin@algions.com`), trigger a password reset or set a strong, random password.
3. Restrict administrative access to verified operations personnel.
