# Plan: Authentication and Authorization Hardening

Implement robust authentication and authorization using Supabase Auth and PostgreSQL RLS policies to ensure private citizen data is isolated and secure.

## User Interface & Authentication
- **Session Persistence**: Verify that `supabase.auth.onAuthStateChange` correctly handles session recovery on page refresh.
- **Login/Signup**: Use `@supabase/auth-ui-react` for a unified login/signup flow (already present, will verify auto-confirm).
- **Logout**: Ensure `supabase.auth.signOut` clears local session and redirects to `/auth`.
- **Protected Routes**: Use TanStack Router's `beforeLoad` in `src/routes/_authenticated.tsx` to guard all sensitive modules.
- **User Profile**: Add a dedicated Profile route (`src/routes/_authenticated/profile.tsx`) to display and edit user information.

## Database & Security (RLS)
Apply strict Row Level Security (RLS) policies to isolate user data.

### Private Tables (User-Owned)
Users can only read/write their own data.
- `profiles`: `using (auth.uid() = id)`
- `documents`: `using (auth.uid() = user_id)`
- `document_chunks`: Indirectly protected by `documents` join or inherited `user_id`.
- `conversations`: `using (auth.uid() = user_id)`
- `messages`: `using (auth.uid() = user_id)`
- `applications`: `using (auth.uid() = user_id)`
- `policy_comparisons`: `using (auth.uid() = user_id)`
- `policy_conflicts`: `using (auth.uid() = user_id)`
- `drafts`: `using (auth.uid() = user_id)`
- `ai_generations`: `using (auth.uid() = user_id)`

### Public Tables (Read-Only for Auth)
- `schemes`: `GRANT SELECT TO authenticated` (and `anon` if applicable).
- `services`: `GRANT SELECT TO authenticated`.
- `scheme_eligibility_rules`, `service_steps`, etc.: `GRANT SELECT TO authenticated`.

## Technical Tasks
- **Migration**: Update RLS policies for all tables created in the foundation phase.
- **Frontend**:
    - Update `AppSidebar` to link to the new `/profile` route.
    - Implement a basic `/profile` page to show user details.
    - Ensure all data-fetching hooks (TanStack Query) correctly handle the authenticated context.
- **Verification**: Use a test account to verify that private data from one user is not accessible to another.

## Security Constraints
- No permissive "allow all" policies.
- No leakage of `service_role` keys.
- Authentication mandatory for all dashboard modules.
