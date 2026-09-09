# MODULE 4: Authentication & User Settings

## DIRECTIVES
Build a functional login system and a real settings panel using Supabase Auth. Implement client-side session protection so unauthenticated users are redirected to a login screen.

## TECH STACK
Next.js (App Router), `@supabase/supabase-js`, Tailwind CSS, `lucide-react`

## EXECUTION STEPS

### 1. The Login Page (`app/login/page.tsx`)
- Create a sleek, dark glassmorphism login page matching the VigilSphere aesthetic.
- Include an Email and Password input field.
- Add two buttons: "Sign In" and "Create Account".
- Wire both buttons to Supabase Auth (`supabase.auth.signInWithPassword` and `supabase.auth.signUp`).
- On successful login, use `next/navigation` `useRouter` to push the user to `/`.

### 2. The Settings Page (`app/settings/page.tsx`)
- Create a Settings dashboard page.
- Fetch the current user session on load using `supabase.auth.getSession()`.
- UI Sections:
  - **Analyst Profile:** Display the user's email. Add an input field to update their Display Name (save this to Supabase `supabase.auth.updateUser({ data: { full_name: newName } })`).
  - **Security Preferences:** Add mock toggle switches for "Two-Factor Authentication (2FA)" and "Strict IP Whitelisting".
  - **Account Actions:** A prominent red "Sign Out" button wired to `supabase.auth.signOut()`, which redirects to `/login`.

### 3. Route Protection & Sidebar Updates
- Update the main Sidebar component (wherever it is located, likely `components/Sidebar.tsx` or in the layout). Change the "Settings" and "Analyst Profile" buttons to be Next.js `<Link href="/settings">` elements.
- Open `app/page.tsx`, `app/triage/page.tsx`, and `app/integrations/page.tsx`. Add a simple `useEffect` at the top of each component that checks `supabase.auth.getSession()`. If no session exists, instantly redirect the user to `/login`.