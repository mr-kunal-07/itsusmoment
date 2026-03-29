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

type CapacitorLike = {
  isNativePlatform?: () => boolean;
  Plugins?: {
    NativeCallControl?: NativeCallControlPlugin;
  };
};

function getCapacitor(): CapacitorLike | null {
  if (typeof window === "undefined") return null;
  return (window as Window & { Capacitor?: CapacitorLike }).Capacitor ?? null;
}

function getNativeCallPlugin(): NativeCallControlPlugin | null {
  const capacitor = getCapacitor();
  if (!capacitor?.isNativePlatform?.()) return null;
  return capacitor.Plugins?.NativeCallControl ?? null;
}

export function hasNativeCallControl(): boolean {
  return !!getNativeCallPlugin();
}

export async function syncNativeCallSession(options: NativeCallSessionOptions): Promise<void> {
  const plugin = getNativeCallPlugin();
  if (!plugin) return;

  if (plugin.updateCallSession) {
    await plugin.updateCallSession(options);
    return;
  }

  if (plugin.startCallSession) {
    await plugin.startCallSession(options);
  }
}

export async function endNativeCallSession(): Promise<void> {
  const plugin = getNativeCallPlugin();
  if (!plugin?.endCallSession) return;
  await plugin.endCallSession();
}
