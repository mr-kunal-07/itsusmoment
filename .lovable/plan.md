
## Problem
The user is locked out of `kunaljadhav2305@gmail.com` because passwords are hashed and cannot be retrieved. The solution is to add a **Forgot Password** flow that sends a reset email, plus a **/reset-password** page to actually set a new password.

## What to build

### 1. `useAuth.tsx` — add `resetPassword` helper
```
resetPasswordForEmail(email) → calls supabase.auth.resetPasswordForEmail(email, { redirectTo: origin + '/reset-password' })
```

### 2. `Auth.tsx` — add "Forgot password?" link
- Below the password field, add a small "Forgot password?" link
- Clicking it toggles to a "forgot" view that shows just the email field + "Send reset link" button
- On success: show toast "Check your email for a reset link"

### 3. New page: `src/pages/ResetPassword.tsx`
- Public route (no auth guard)
- On mount, detects `type=recovery` in the URL hash (Supabase sets this automatically)
- Shows a form: New password + Confirm password
- On submit: calls `supabase.auth.updateUser({ password })`
- On success: redirects to `/auth` with toast "Password updated successfully"

### 4. `App.tsx` — add `/reset-password` route
```
<Route path="/reset-password" element={<ResetPassword />} />
```

## Flow
```text
Login page
  └─ "Forgot password?" link
       └─ Enter email → "Send reset link"
            └─ Email sent → user clicks link in email
                 └─ Opens /reset-password (with recovery token in URL)
                      └─ Enter new password → submit
                           └─ Redirected to /auth → log in with new password
```

## Files to change
- `src/hooks/useAuth.tsx` — add `resetPasswordForEmail`
- `src/pages/Auth.tsx` — add forgot password toggle view
- `src/pages/ResetPassword.tsx` — new file
- `src/App.tsx` — register `/reset-password` route

No database changes needed.
