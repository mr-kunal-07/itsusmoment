# Comprehensive Project Analysis: ItsUsMoment

## 1. Overview & Tech Stack
This project is a modern web application built with a React frontend and a Supabase backend. The repository contains 240 source files, spanning across frontend UI components, configuration, and backend edge functions/migrations.

### Key Technologies 
- **Framework:** React 18 with TypeScript, bundled by Vite.
- **Routing:** `react-router-dom` v6 for client-side navigation.
- **Styling:** Tailwind CSS integrated with Shadcn UI (Radix UI primitives).
- **State Management:** `@tanstack/react-query` for server state, context APIs for local state.
- **Backend/BaaS:** Supabase used for Database, Authentication, and Edge Functions.
- **Forms & Validation:** `react-hook-form` paired with `zod`.
- **Other utilities:** `framer-motion` for animations, `date-fns` for dates.

---

## 2. Core Architecture

### Routing & Navigation ([src/App.tsx](file:///C:/Users/Pinky/OneDrive/Desktop/usmonent/src/App.tsx))
The app defines strict boundaries between public and protected routes:
- **Public Routes (`<PublicOnlyRoute>`):** `/` (Landing), `/auth`, `/reset-password`, `/join`.
- **Protected Routes (`<ProtectedRoute>`):** `/dashboard`, `/dashboard/:tab`, `/dashboard/folder/:folderId`, `/profile`, `/admin`.
- **Route Guards:** Uses an `AuthProvider` implementation that checks the current active session. The [ProtectedRoute](file:///C:/Users/Pinky/OneDrive/Desktop/usmonent/src/App.tsx#47-57) also strictly enforces an `AppLockScreen`, indicating an additional layer of security (e.g. PIN or biometrics) for authenticated users.

### State & Data Fetching
- **React Query:** A single `QueryClient` instance handles all async data fetching, caching, and mutation, using a `staleTime` of 1 minute and `gcTime` of 5 minutes.
- **Auth Context:** The `AuthProvider` handles initialization, exposing the state universally via `useAuth()`.

---

## 3. Key Components & Features Structure

### `src/components/` (115+ files)
This heavily populated directory contains both generic UI elements and complex feature-specific modules:
- **Shared UI:** Standard Shadcn components (Dialogs, Accords, Dropdowns, Tabs, etc.)
- **Navigation:** `AppSidebar.tsx`, `MobileBottomNav.tsx`.
- **Chat/Messages System:** Located in `components/chat/` with drawing capabilities (`DrawingCanvas`), emoji pickers, and themes.
- **Memories/Media:** Components like `MediaGrid.tsx`, `UploadDialog.tsx`, `Anniversarycard.tsx`, and `Slideshow.tsx`.
- **Billing:** `BillingView.tsx`, `UpgradeBanner.tsx`.

### `src/pages/`
Maps to top-level routes:
- `Auth.tsx`, `Join.tsx`, `AuthCallback.tsx`
- `Dashboard.tsx`
- `Index.tsx` (Landing page)
- `Admin.tsx`
- `Profile.tsx`

---

## 4. Backend Architecture (`supabase/`)

### Edge Functions
The backend extends Supabase capabilities via serverless edge functions (`supabase/functions/`):
- `admin-*`: Audit logging, user listing, and user management.
- `purge-*`: Background tasks to delete old media and messages.
- `razorpay-*`: Payment gateway integration for creating orders, subscriptions, and verifying payments.
- `send-push`: Push notification orchestration.

### Database Migrations (`supabase/migrations/`)
Contains 26 SQL migration files (e.g., `20260222...sql` to `20260309...sql`), mapping out recent adjustments to the schema, enforcing Row Level Security (RLS), and setting up tables for users, folders, chat, and subscriptions.

---

## Recommended Next Steps
Due to the sheer scale of the codebase (240 files), an exhaustive line-by-line review of every file is counterproductive in a single session. 

**I recommend selecting a specific vertical or module to deep dive into next:**
1. **Authentication Flow** (Auth contexts, Supabase auth sync).
2. **Dashboard & Folder System** (How media is categorized and fetched).
3. **Billing Integration** (Razorpay integration frontend to edge function).
4. **Chat Module** (Realtime messaging, themes, drawing component).

*Please let me know which area you would like me to analyze line-by-line.*
