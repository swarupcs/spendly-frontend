# Spendly Frontend — Security & Code Quality Audit

> **Date**: 2026-05-10  
> **Scope**: Frontend-specific issues identified during full-stack review

---

## Issue #1 — 🔴 HIGH: Tokens Stored in localStorage (XSS Vulnerable)

**File**: `src/api/client.ts` (lines 5–12)

**Problem**:
```typescript
export const tokenStorage = {
  getAccess: (): string | null => localStorage.getItem('accessToken'),
  getRefresh: (): string | null => localStorage.getItem('refreshToken'),
  set: (access: string, refresh: string): void => {
    localStorage.setItem('accessToken', access);
    localStorage.setItem('refreshToken', refresh);
  },
  clear: (): void => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  },
};
```

**Risk**: `localStorage` is accessible to any JavaScript running on the page. A single XSS vulnerability (even from a third-party dependency) allows an attacker to steal both access and refresh tokens, enabling full account takeover.

**Fix**: 
- Store tokens in HttpOnly, Secure, SameSite=Strict cookies set by the backend.
- If cookies aren't feasible, use `sessionStorage` (less persistent) and implement token binding/fingerprinting.

---

## Issue #2 — 🟠 HIGH: Duplicate API Client Implementations

**Files**: `src/api/client.ts` and `src/config/api.ts`

**Problem**: Two separate HTTP client implementations exist:
- `src/api/client.ts` — full-featured with auth headers, token refresh, and retry logic
- `src/config/api.ts` — simpler version without authentication

The `config/api.ts` chat streaming function sends requests **without any Authorization header**:
```typescript
const res = await fetch(`${BASE_URL}/chat`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ query, threadId }), // No auth!
});
```

**Risk**:
- Inconsistent auth coverage — some calls may bypass authentication
- Developer confusion about which client to use
- If a protected endpoint is accidentally called via the unauthenticated client, it silently fails

**Fix**:
1. Remove `src/config/api.ts` (or rename/repurpose as types-only).
2. Consolidate all HTTP calls through `src/api/client.ts` which handles auth.
3. Add `fetchWithAuth` support to the SSE streaming function.

---

## Issue #3 — 🟡 MEDIUM: Google OAuth Callback Reads Tokens from URL

**File**: (likely `src/pages/auth/GoogleCallback.tsx` or similar route handler)

**Problem**: The frontend reads `accessToken` and `refreshToken` from URL query params after the Google OAuth redirect. This is the client-side counterpart to the backend issue (see backend audit Issue #1).

```
/auth/google/callback?accessToken=xxx&refreshToken=yyy&user={...}
```

**Risk**: Even though the frontend cleans up the URL, the tokens are:
- Briefly visible in the browser address bar
- Stored in browser history
- Potentially captured by browser extensions

**Fix**: Coordinate with backend to implement opaque code exchange (see backend audit).

---

## Issue #4 — 🟡 MEDIUM: No Error Boundary or Global Error Handling

**Observation**: React 19 apps should implement error boundaries to gracefully handle rendering errors. Without them, a crash in any component can white-screen the entire app.

**Fix**: Add a root-level error boundary with a user-friendly fallback UI and error reporting.

---

## Summary Priority Matrix

| # | Severity | Issue | Effort |
|---|----------|-------|--------|
| 1 | 🔴 High | localStorage token storage | High (needs backend changes) |
| 2 | 🟠 High | Duplicate API clients | Medium |
| 3 | 🟡 Medium | OAuth tokens from URL | Medium (backend coordination) |
| 4 | 🟡 Medium | No error boundary | Low |
