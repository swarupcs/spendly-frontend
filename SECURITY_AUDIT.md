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

## Issue #5 — 🟠 HIGH: Auth Store `isAuthenticated` Persisted — Guard Bypass

**File**: `src/store/auth.store.ts`

**Problem**: Zustand `persist` stores `isAuthenticated` boolean in localStorage:

```typescript
persist(
  (set, get) => ({ ... }),
  {
    name: 'auth-store',
    partialize: (state) => ({
      user: state.user,
      isAuthenticated: state.isAuthenticated, // ← Persisted!
    }),
  },
)
```

**Risk**: An attacker (or curious user) can manually set `localStorage['auth-store']` to `{"state":{"user":{"id":1,"role":"ADMIN",...},"isAuthenticated":true}}` to:
- Bypass `ProtectedRoute` guards on initial render (before `hydrate()` validates token)
- Potentially access admin UI routes and see the admin interface structure
- While backend calls will fail, the frontend layout/component structure leaks information

**Fix**: 
- Don't persist `isAuthenticated` — always derive it from valid token presence.
- Add a loading/splash screen that blocks rendering until `hydrate()` completes server-side validation.
- Never render admin UI structure without a role-check backed by fresh `/auth/me` response.

---

## Issue #6 — 🟡 MEDIUM: Token Refresh Race Condition Across Tabs

**File**: `src/api/client.ts` (lines 18–40)

**Problem**: The `refreshPromise` singleton prevents duplicate refresh calls within a single tab, but provides no coordination across multiple browser tabs:

```typescript
let refreshPromise: Promise<boolean> | null = null;
```

If two tabs simultaneously detect a 401:
1. Tab A calls refresh → gets new tokens → stores them
2. Tab B calls refresh with the OLD refresh token → it was already revoked by Tab A → refresh fails
3. Tab B clears storage and redirects to login — logging the user out everywhere

**Risk**: Multi-tab users get unexpectedly logged out during normal usage.

**Fix**: 
- Use `BroadcastChannel` API to coordinate refresh across tabs
- Or use a `localStorage` event listener to detect when tokens are updated by another tab
- Example: Before refreshing, check if tokens changed since the 401 was received

---

## Issue #7 — 🟡 MEDIUM: No Admin Route Guard on Frontend

**File**: `src/App.tsx`

**Problem**: The `/admin` routes are wrapped in `ProtectedRoute` (auth check) but have no **role-based** guard:

```typescript
<Route path='/admin' element={<AdminLayout />}>
  {/* No role check — any authenticated user can see the admin UI */}
</Route>
```

**Risk**: While backend API calls require ADMIN role, any authenticated user can navigate to `/admin` and:
- See the admin dashboard layout/components
- Observe what admin features exist
- Attempt to use the UI (requests fail, but reveal API structure)

**Fix**: Add a `RequireRole` wrapper component:
```typescript
<Route path='/admin' element={<RequireRole role="ADMIN"><AdminLayout /></RequireRole>}>
```

---

## Issue #8 — 🟡 LOW: No Request Deduplication on `hydrate()`

**File**: `src/store/auth.store.ts`

**Problem**: The `hydrate()` function has no deduplication guard. If called multiple times (e.g., React StrictMode, concurrent component mounts), it fires multiple `/auth/me` requests:

```typescript
hydrate: async () => {
  const token = tokenStorage.getAccess();
  if (!token || get().isAuthenticated) return; // Only checks current state
  set({ isLoading: true });
  // ... fires request
}
```

In React 18+ StrictMode, effects run twice in development, potentially causing duplicate network requests.

**Risk**: Minor — wasted requests and potential race between two `hydrate()` calls setting state.

**Fix**: Add a module-level `hydratePromise` to deduplicate concurrent calls.

---

## Summary Priority Matrix

| # | Severity | Issue | Effort |
|---|----------|-------|--------|
| 1 | 🔴 High | localStorage token storage | High (needs backend changes) |
| 2 | 🟠 High | Duplicate API clients | Medium |
| 5 | 🟠 High | Auth store guard bypass | Low |
| 3 | 🟡 Medium | OAuth tokens from URL | Medium (backend coordination) |
| 4 | 🟡 Medium | No error boundary | Low |
| 6 | 🟡 Medium | Multi-tab refresh race | Medium |
| 7 | 🟡 Medium | No admin role guard | Low |
| 8 | 🟡 Low | Hydrate deduplication | Trivial |
