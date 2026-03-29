package com.usmoment.app.nativecall

import android.content.Context
import android.hardware.Sensor
import android.hardware.SensorEvent
import android.hardware.SensorEventListener
import android.hardware.SensorManager
import android.media.AudioManager
import android.os.PowerManager

class NativeCallControl(private val context: Context) : SensorEventListener {
    private val audioManager =
        context.getSystemService(Context.AUDIO_SERVICE) as AudioManager
    private val sensorManager =
        context.getSystemService(Context.SENSOR_SERVICE) as SensorManager
    private val proximitySensor: Sensor? =
        sensorManager.getDefaultSensor(Sensor.TYPE_PROXIMITY)
    private val powerManager =
        context.getSystemService(Context.POWER_SERVICE) as PowerManager

    private var wakeLock: PowerManager.WakeLock? = null
    private var proximityEnabled = false

    fun startCallSession(
        mode: String,
        useSpeaker: Boolean,
        enableProximityMonitoring: Boolean,
        keepScreenAwake: Boolean,
    ) {
        applyAudioMode(mode, useSpeaker)
        updateProximityMonitoring(enableProximityMonitoring)
        updateWakeLock(keepScreenAwake)
    }

    fun updateCallSession(
        mode: String,
        useSpeaker: Boolean,
        enableProximityMonitoring: Boolean,
        keepScreenAwake: Boolean,
    ) {
        applyAudioMode(mode, useSpeaker)
        updateProximityMonitoring(enableProximityMonitoring)
        updateWakeLock(keepScreenAwake)
    }

    fun endCallSession() {
        audioManager.isSpeakerphoneOn = false
        audioManager.mode = AudioManager.MODE_NORMAL
        updateProximityMonitoring(false)
        updateWakeLock(false)
    }

    private fun applyAudioMode(mode: String, useSpeaker: Boolean) {
        audioManager.mode =
            if (mode == "voice") AudioManager.MODE_IN_COMMUNICATION else AudioManager.MODE_NORMAL
        audioManager.isSpeakerphoneOn = useSpeaker
    }

    private fun updateProximityMonitoring(enable: Boolean) {
        if (enable == proximityEnabled) return
        proximityEnabled = enable

        if (enable && proximitySensor != null) {
          sensorManager.registerListener(this, proximitySensor, SensorManager.SENSOR_DELAY_NORMAL)
        } else {
          sensorManager.unregisterListener(this)
        }
    }

    private fun updateWakeLock(keepAwake: Boolean) {
        if (keepAwake) {
            if (wakeLock?.isHeld == true) return
            wakeLock = powerManager.newWakeLock(
                PowerManager.SCREEN_BRIGHT_WAKE_LOCK or PowerManager.ACQUIRE_CAUSES_WAKEUP,
                "usmoment:call-screen"
            ).apply {
                setReferenceCounted(false)
                acquire(10 * 60 * 1000L)
            }
            return
        }

        wakeLock?.let {
            if (it.isHeld) it.release()
        }
        wakeLock = null
    }

    override fun onSensorChanged(event: SensorEvent?) {
        // Final screen-off / wake behavior should be refined inside the real Android app host.
    }

    override fun onAccuracyChanged(sensor: Sensor?, accuracy: Int) = Unit
}
