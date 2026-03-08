
## Full Project Audit — What's Missing & What We Can Do More

### Current State Summary
OurVault is a well-built couples media vault with: Auth, file upload/manage, folders, chat (WhatsApp-style), memories timeline, anniversaries/milestones, activity feed, notifications, love notes on photos, tags, billing/plans, admin panel, slideshow, PWA support, app lock (biometric+PIN), and a polished landing page.

---

### What's Missing (Gaps & Incomplete Features)

**1. Chat — Still Not Fully Mobile-Responsive**
The keyboard-push issue is not fully fixed. The current approach using `env(safe-area-inset-bottom)` and CSS alone doesn't work reliably on Android Chrome or iOS Safari because those browsers don't consistently support `interactive-widget=resizes-content`. The input bar still gets hidden behind the keyboard on many devices.

**Fix needed:**
- Use the `visualViewport` API with a proper `resize` event listener (not `scroll`)
- Set the chat wrapper's `height` and `paddingBottom` dynamically based on `window.innerHeight - visualViewport.height`
- Use `position: fixed` for the input bar anchored to the visual viewport bottom

**2. Chat — Attachment/Media Sharing Not Wired Up**
The `Paperclip` icon in the chat input bar does nothing — no `onClick` handler. Users can't share photos from their vault in chat.

**3. Chat — Video/Voice Call Buttons Are Decorative**
The Phone and Video icons in the chat header have no actions. Should either be removed or replaced with a "coming soon" indicator.

**4. Relationship Stats Page Not Accessible**
`RelationshipStats` component exists in `MemoriesView.tsx` but is never rendered anywhere — there's no route or view that shows it. The sidebar has no entry for stats.

**5. "On This Day" Notification**
There's no push/in-app notification when today matches a memory date. The feature shows up in the sidebar but only when `onThisDayMedia.length > 0`, but the user gets no proactive alert.

**6. UpgradeBanner Only Shows on "All Files"**
The banner is filtered to `selectedView === "all"` only, so users never see it when browsing folders, starred, or timeline.

**7. Profile Page (`/profile`) Is a Separate Route But Unused**
`Profile.tsx` exists as a full page but the app never navigates there — Settings is the only profile management surface. The `/profile` route is orphaned.

**8. No "Change PIN" Flow**
Once a PIN is set, users can only disable lock and re-enable to set a new PIN. There's no "Change PIN" option.

**9. Admin Panel — No Route Link from Dashboard**
Admin link in the sidebar only works if `useIsAdmin()` returns true, but there's no feedback when the user isn't an admin (the link just doesn't show). Also the `/admin` route has no `<Admin>` component description in the codebase view.

**10. Tags Feature Exists But No Tag-Based Filtering**
Tags can be added to media in the preview panel (`TagsPanel`), but there's no way to filter/browse by tag in the main media grid or sidebar.

**11. `formatSize` Utility Is Duplicated 4 Times**
Defined separately in `MemoriesView.tsx`, `MediaPreview.tsx`, `MediaGrid.tsx`, `AppSidebar.tsx` — violates DRY from the last refactor.

---

### What We Can Do More (New Features)

**A. Shared Playlist / Music Mood**
A "Our Song" feature where couples can link a Spotify/YouTube URL and it shows up as a pinned card.

**B. Partner Birthday / Anniversary Reminders via Email**
Edge function that runs on a schedule and sends reminder emails X days before a milestone date.

**C. Couple Stats Dashboard**
Wire up the already-built `RelationshipStats` component as a proper view — show total photos, videos, days together, storage used, messages sent.

**D. Caption / Description on Upload**
The upload dialog collects a title but no description per file. The `Media` type has a `description` field but it's not surfaced in the upload flow.

**E. Memory Map (Geo-tagging)**
Use EXIF GPS data (already extracting EXIF dates) to show a map of where photos were taken.

**F. Photo Books / Albums Export**
Let couples export a folder or selection as a PDF photo book.

**G. Crop / Filter on Upload**
Basic image crop before upload using a canvas crop tool.

**H. Shared Bucket List**
A simple checklist/todo list shared between the couple — "Places we want to go", "Things to try together".

---

### Plan: What to Build Now (Priority Order)

The most impactful, completable improvements:

```
Priority  Feature
────────────────────────────────────────────────
1  Fix chat mobile keyboard (proper visualViewport)
2  Add Relationship Stats view (wire up existing component)
3  Fix UpgradeBanner to show on all media views
4  Remove/replace decorative Phone/Video call buttons
5  Add "Change PIN" flow in Settings
6  Wire Paperclip → share from vault in chat
7  Extract formatSize to src/lib/utils.ts (DRY fix)
8  Add tag-based browsing in sidebar / media grid
9  Add Bucket List feature (shared couple checklist)
```

---

### Technical Plan

**Files to change:**

- `src/components/ChatView.tsx` — Fix keyboard with `visualViewport` + fix Paperclip + remove/stub call buttons
- `src/lib/utils.ts` — Add shared `formatSize` helper
- `src/components/MemoriesView.tsx`, `MediaPreview.tsx`, `MediaGrid.tsx`, `AppSidebar.tsx` — Remove duplicate `formatSize`, import from utils
- `src/components/SettingsView.tsx` — Add "Change PIN" flow
- `src/components/UpgradeBanner.tsx` — Remove `selectedView === "all"` restriction
- `src/pages/Dashboard.tsx` — Add `"stats"` to `NON_GRID_VIEWS`, render `RelationshipStats` for that view
- `src/components/AppSidebar.tsx` — Add Stats nav item to "For Us" section
- New: `src/components/BucketList.tsx` + DB migration for `bucket_list` table
- `src/pages/Dashboard.tsx` — Add `"bucket-list"` view + route

**Database needed:**
- `bucket_list` table: `id`, `couple_id`, `added_by`, `text`, `done`, `created_at`
- RLS: only couple members can read/write their own items

**No new dependencies required** — all within existing stack.
