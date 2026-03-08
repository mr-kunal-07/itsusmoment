
## Plan: Rewrite README.md with Full Product Documentation

The current README is a generic Lovable template with placeholder URLs. The user wants it replaced with proper OurVault product documentation covering all features, tech stack, and setup instructions discovered from the codebase.

### What I'll write in README.md

**Sections:**

1. **Header** — OurVault name, tagline, live URL badge
2. **Overview** — What the product is (couples-only private vault)
3. **Features** (full list from codebase):
   - Authentication & Partner Linking (email/password, invite codes, couple linking/unlinking)
   - Media Vault (upload photos/videos up to 500MB, EXIF metadata, folders, grid/list, sort, search, star, soft-delete with 14-day trash, bulk actions, move between folders)
   - Media Preview (lightbox, video player, swipe nav, keyboard nav, download, copy link, love notes, tags)
   - Memories (Timeline view, On This Day, Anniversaries & Milestones with countdown rings, Milestone Calendar)
   - Bucket List (categories, due dates, completion photos, emoji reactions)
   - Chat (E2E AES-256-GCM encrypted, real-time, voice messages, typing indicators, online presence, read receipts, reply-to, reactions via long-press/hover, select & delete multiple, partner can delete both sides, auto-purge daily at 3AM UTC)
   - Activity Feed (uploads, notes, reactions, milestones)
   - Notifications (real-time partner alerts)
   - Days Together widget
   - App Lock (PIN + WebAuthn biometric, locks after 15s in background)
   - Billing (3 plans via Razorpay — Single free, Dating, Soulmate; shared storage pools)
   - Settings (profile, avatar, theme, app lock, PWA install)
   - Admin Panel (user management, plan changes, audit log)
   - PWA (installable, offline-ready)
   - Dark / Light theme

4. **Tech Stack** (full list):
   - Frontend: React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui + Radix UI primitives
   - State / Data: TanStack React Query v5
   - Routing: React Router v6
   - Forms: React Hook Form + Zod
   - Charts: Recharts
   - Dates: date-fns
   - Media: exifr (EXIF extraction), embla-carousel, Vaul (drawer)
   - Backend: Supabase (PostgreSQL, Auth, Storage, Realtime, Edge Functions)
   - Automation: pg_cron (3AM message purge, media purge)
   - Payments: Razorpay (Indian payment gateway)
   - Security: AES-256-GCM client-side E2E encryption, PBKDF2 key derivation, WebAuthn biometrics
   - PWA: vite-plugin-pwa

5. **Database Tables** (from types.ts):
   - bucket_list, bucket_list_reactions, couples, folders, love_notes, media, media_reactions, media_tags, message_reactions, messages, milestones, notifications, plan_audit_log, profiles, subscriptions, tags, user_roles

6. **Subscription Plans** table

7. **Security Architecture** section (E2E encryption details, RLS, App Lock)

8. **Local Development** setup instructions

9. **Edge Functions** list

10. **Live URLs** (preview + published)

### File to change
- `README.md` — full rewrite (single file, no DB/code changes needed)
