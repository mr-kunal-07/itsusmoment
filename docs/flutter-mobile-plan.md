# Flutter Mobile Plan

Recommended product split:

- keep the current React app for web
- build a separate Flutter app for Android and iOS

## Why this is the best path

- avoids risky full frontend replacement all at once
- keeps the current product usable
- lets calls, app lock, audio routing, and proximity behavior move to native mobile
- reuses the current Supabase backend

## Reuse from current platform

- auth model
- couples model
- media storage
- chat tables and realtime events
- billing records
- invite flow

## Rebuild in Flutter

- auth screens
- dashboard shell
- chat UI
- media viewer
- call UI and call control
- app lock

## First milestone

1. Flutter app bootstrap
2. Supabase auth
3. active couple detection
4. chat list and messages
5. native call setup

## Current scaffold

- `apps/mobile_flutter/pubspec.yaml`
- `apps/mobile_flutter/lib/`
- `apps/mobile_flutter/.env.example`

## Current implemented scaffold

- Supabase bootstrap service
- Riverpod auth repository/controller
- session gate screen
- basic sign in / sign up screen
- dashboard shell
- chat route placeholder
