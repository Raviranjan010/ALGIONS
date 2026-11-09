# Known Limitations & Future Architecture Roadmap

**Document:** `docs/KNOWN_LIMITATIONS.md`  
**System:** ALGIONS Bus Booking Management System  

---

## 1. Known Architectural Scope & Boundaries

1. **Payment Gateway Integration**:
   - The assessment requirements explicitly specify a **simulated refund schedule** rather than a real payment processor integration.
   - Payment status is simulated as `simulated_processed` or `non_refundable` according to the tiered policy (>24h: 90%, 12-24h: 75%, 2-12h: 50%, <2h: 0%).
   - Production scaling with a commercial payment gateway (e.g. Stripe, Razorpay) would introduce a two-phase commit with webhook listeners.
2. **Git Push via Non-Interactive Tooling**:
   - On Windows with Git Credential Manager (GCM), pushing to GitHub from a headless background CLI process waits indefinitely for the interactive GUI OAuth prompt.
   - Pushing requires the user to execute `git push origin main` in their interactive terminal or configure a Personal Access Token (PAT).
3. **Multi-Instance Serverless Rate Limiting**:
   - The built-in rate limiter (`src/lib/security/rate-limit.ts`) uses an in-memory sliding window cache per serverless instance.
   - For high-volume multi-region edge deployments with shared state across serverless nodes, an external distributed Redis store (e.g. Upstash Redis) can be plugged in without changing the API contract.
4. **Offline Mock Fallback**:
   - To enable offline test suites and developer onboarding without a remote database, services provide an in-memory transactional fallback.
   - In production (`NODE_ENV === 'production'`), this fallback is explicitly disabled by `assertProductionEnv()`.

