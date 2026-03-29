package com.usmoment.app.nativecall;

import android.content.Context;
import android.media.AudioManager;
import android.os.PowerManager;

public class NativeCallControl {
    private final AudioManager audioManager;
    private final PowerManager powerManager;
    private PowerManager.WakeLock proximityWakeLock;
    private PowerManager.WakeLock screenWakeLock;

    public NativeCallControl(Context context) {
        audioManager = (AudioManager) context.getSystemService(Context.AUDIO_SERVICE);
        powerManager = (PowerManager) context.getSystemService(Context.POWER_SERVICE);
    }

    public void startCallSession(
        String mode,
        boolean useSpeaker,
        boolean enableProximityMonitoring,
        boolean keepScreenAwake
    ) {
        applyAudioMode(mode, useSpeaker);
        updateProximityMonitoring(enableProximityMonitoring);
        updateScreenWakeLock(keepScreenAwake);
    }

    public void updateCallSession(
        String mode,
        boolean useSpeaker,
        boolean enableProximityMonitoring,
        boolean keepScreenAwake
    ) {
        applyAudioMode(mode, useSpeaker);
        updateProximityMonitoring(enableProximityMonitoring);
        updateScreenWakeLock(keepScreenAwake);
    }

    public void endCallSession() {
        updateProximityMonitoring(false);
        updateScreenWakeLock(false);
        audioManager.setSpeakerphoneOn(false);
        audioManager.setMode(AudioManager.MODE_NORMAL);
    }

    private void applyAudioMode(String mode, boolean useSpeaker) {
        boolean isVoice = "voice".equals(mode);
        audioManager.setMode(isVoice ? AudioManager.MODE_IN_COMMUNICATION : AudioManager.MODE_NORMAL);
        audioManager.setSpeakerphoneOn(useSpeaker);
    }

    @SuppressWarnings("deprecation")
    private void updateProximityMonitoring(boolean enabled) {
        if (enabled) {
            if (proximityWakeLock == null) {
                proximityWakeLock = powerManager.newWakeLock(
                    PowerManager.PROXIMITY_SCREEN_OFF_WAKE_LOCK,
                    "usmoment:native-call-proximity"
                );
                proximityWakeLock.setReferenceCounted(false);
            }
            if (!proximityWakeLock.isHeld()) {
                proximityWakeLock.acquire(10 * 60 * 1000L);
            }
            return;
        }

        if (proximityWakeLock != null && proximityWakeLock.isHeld()) {
            proximityWakeLock.release();
        }
    }

    private void updateScreenWakeLock(boolean enabled) {
        if (enabled) {
            if (screenWakeLock == null) {
                screenWakeLock = powerManager.newWakeLock(
                    PowerManager.SCREEN_DIM_WAKE_LOCK,
                    "usmoment:native-call-screen"
                );
                screenWakeLock.setReferenceCounted(false);
            }
            if (!screenWakeLock.isHeld()) {
                screenWakeLock.acquire(10 * 60 * 1000L);
            }
            return;
        }

        if (screenWakeLock != null && screenWakeLock.isHeld()) {
            screenWakeLock.release();
        }
    }
}
