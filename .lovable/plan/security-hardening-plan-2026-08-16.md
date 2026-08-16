# Security Hardening Plan

Implement security fixes for identified potential vulnerabilities in the GovCopilot backend and frontend.

## Database & RLS Fixes

### Profiles Privacy
- **Issue:** `Public profiles are viewable by everyone.` policy allows anonymous/unauthenticated users to read all profile data.
- **Fix:** Restrict `SELECT` on `public.profiles` to `authenticated` users only, and only for their own rows (or limited fields if public discovery is needed later).
- **Update:** Remove the "viewable by everyone" policy and replace with "view own profile".

### Scheme Chat Messages Security
- **Issue:** The `scheme_chat_messages` table allows `INSERT` via the `authenticated` role, but the current `WITH CHECK` only verifies the `user_id` matches `auth.uid()`.
- **Fix:** Ensure that the `role` field can only be 'user' for client-initiated inserts (AI responses should ideally be handled via a trusted backend process, though currently the client saves them).
- **Refinement:** Adjust `INSERT` policy to ensure users can't spoof `user_id`.

## Authentication & Authorization

### Auth Redirection
- **Issue:** Application lacks a centralized `_authenticated` layout or route gate for protected modules.
- **Fix:** Create `src/routes/_authenticated.tsx` and move sensitive routes (`/documents`, `/policy`, `/workflow`, `/drafts`, `/copilot`, `/applications`, `/eligibility`) under this pathless layout.
- **Implementation:** Implement a loader in `_authenticated.tsx` that redirects to `/auth` if no session is present.

### Server Function Protection
- **Issue:** Server functions use `requireSupabaseAuth` but there is no catch-all for unauthorized access in the UI other than individual function errors.
- **Fix:** Consistently handle 401 responses from server functions to trigger a logout/re-auth flow.

## Technical Tasks

1. **Migration:** Create a new migration to harden RLS policies.
   ```sql
   -- profiles
   DROP POLICY "Public profiles are viewable by everyone." ON public.profiles;
   CREATE POLICY "Users can view own profile." ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
   
   -- chat messages refinement
   -- (Already has user_id check, adding role constraint if possible/needed)
   ```
2. **Routing:**
   - Create `src/routes/_authenticated.tsx` layout.
   - Update `src/routeTree.gen.ts` (via Vite) after moving route files.
3. **Auth Route:** Create `src/routes/auth.tsx` for login/signup if it doesn't exist (using Supabase Auth UI).

## Verification
- Test accessing `/documents` without logging in (should redirect).
- Test cross-user data access via Supabase client in console (should fail).
- Verify server functions return 401 when token is missing.
