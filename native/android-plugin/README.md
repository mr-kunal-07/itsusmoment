# Native Android Call Plugin Scaffold

These files are intentionally kept separate from the live web app runtime.

Purpose:

- prepare an Android-native call control plugin
- keep current web/PWA calling stable
- avoid enabling native routing until the Android platform is actually added

## Planned Capacitor plugin name

`NativeCallControl`

## Expected methods

- `startCallSession`
- `updateCallSession`
- `endCallSession`

## Suggested activation flow

1. `npm install`
2. `npm run build:mobile`
3. `npx cap add android`
4. move these plugin files into the generated Android project
5. register the plugin in the Android app
6. only then re-enable runtime bridge usage behind a native-platform check
