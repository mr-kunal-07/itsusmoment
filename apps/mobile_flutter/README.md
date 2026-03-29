# usMoment Flutter Mobile App

This is the new Flutter mobile app scaffold that will live alongside the current web app.

Why this setup:

- keep the current React web app working
- build a real native-capable mobile app for Android and iOS
- reuse the existing Supabase backend
- move chat, calls, app lock, and media flows toward native mobile behavior

## Planned priorities

1. Auth
2. Couple bootstrap
3. Chat
4. Voice/video calling
5. Media vault
6. Memories and milestones

## Backend reuse

The Flutter app is intended to reuse:

- Supabase auth
- Supabase storage
- Supabase realtime
- existing database schema
- existing edge functions where appropriate

## Current status

This folder is a manual scaffold because Flutter SDK is not installed on this machine yet.

Once Flutter is installed, the next step is:

1. run `flutter create .` inside `apps/mobile_flutter`
2. merge the generated platform files with this scaffold
3. add `supabase_flutter`
4. start implementing auth and dashboard bootstrap

## Run with Supabase

Example:

```bash
flutter run \
  --dart-define=SUPABASE_URL=https://your-project.supabase.co \
  --dart-define=SUPABASE_ANON_KEY=your-anon-key
```
