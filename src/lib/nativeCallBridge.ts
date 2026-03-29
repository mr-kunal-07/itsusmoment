import { Capacitor, registerPlugin } from "@capacitor/core";

type NativeCallMode = "voice" | "video";

type NativeCallSessionOptions = {
  mode: NativeCallMode;
  useSpeaker: boolean;
  enableProximityMonitoring: boolean;
  keepScreenAwake: boolean;
};

type NativeCallControlPlugin = {
  startCallSession?: (options: NativeCallSessionOptions) => Promise<void> | void;
  updateCallSession?: (options: NativeCallSessionOptions) => Promise<void> | void;
  endCallSession?: () => Promise<void> | void;
};
const NativeCallControl = registerPlugin<NativeCallControlPlugin>("NativeCallControl");

export function hasNativeCallControl(): boolean {
  return Capacitor.isNativePlatform();
}

export async function syncNativeCallSession(options: NativeCallSessionOptions): Promise<void> {
  if (!hasNativeCallControl()) return;

  try {
    if (NativeCallControl.updateCallSession) {
      await NativeCallControl.updateCallSession(options);
      return;
    }
    if (NativeCallControl.startCallSession) {
      await NativeCallControl.startCallSession(options);
    }
  } catch (error) {
    console.warn("Native call session sync failed:", error);
  }
}

export async function endNativeCallSession(): Promise<void> {
  if (!hasNativeCallControl() || !NativeCallControl.endCallSession) return;

  try {
    await NativeCallControl.endCallSession();
  } catch (error) {
    console.warn("Native call session cleanup failed:", error);
  }
}
