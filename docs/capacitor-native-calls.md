# Capacitor Native Calling

This project now includes a Capacitor-ready call bridge for WhatsApp-style mobile call behavior.

## What the web app can do

- Default voice calls to non-speaker audio
- Hint the browser toward voice-call audio behavior
- Keep the call UI and routing controls aligned with voice/video mode

## What needs native mobile support

- Proximity sensor turns screen off near the ear
- True earpiece routing for voice calls
- Stronger audio focus / interruption handling
- Screen wake / call-session device behavior

## Current bridge contract

The web app will look for a Capacitor plugin named `NativeCallControl`.

Expected plugin methods:

- `startCallSession(options)`
- `updateCallSession(options)`
- `endCallSession()`

`options` shape:

```ts
{
  mode: "voice" | "video";
  useSpeaker: boolean;
  enableProximityMonitoring: boolean;
  keepScreenAwake: boolean;
}
```

## Suggested next Android steps

1. Install Capacitor packages.
2. Run a production web build.
3. Add the Android platform.
4. Implement the `NativeCallControl` plugin in Android.
5. Map:
   - `enableProximityMonitoring` -> proximity sensor + screen-off behavior
   - `useSpeaker` -> audio route selection
   - `mode: "voice"` -> in-call audio mode
   - `keepScreenAwake` -> wake lock / screen policy

## Current code entry points

- `capacitor.config.ts`
- `src/lib/nativeCallBridge.ts`
- `src/components/chat/CallModal.tsx`
