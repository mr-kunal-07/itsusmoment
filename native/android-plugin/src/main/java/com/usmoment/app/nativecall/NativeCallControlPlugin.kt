package com.usmoment.app.nativecall

import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin

@CapacitorPlugin(name = "NativeCallControl")
class NativeCallControlPlugin : Plugin() {
    private lateinit var nativeCallControl: NativeCallControl

    override fun load() {
        nativeCallControl = NativeCallControl(context)
    }

    @PluginMethod
    fun startCallSession(call: PluginCall) {
        nativeCallControl.startCallSession(
            mode = call.getString("mode") ?: "voice",
            useSpeaker = call.getBoolean("useSpeaker", false) == true,
            enableProximityMonitoring = call.getBoolean("enableProximityMonitoring", false) == true,
            keepScreenAwake = call.getBoolean("keepScreenAwake", false) == true,
        )
        call.resolve(JSObject())
    }

    @PluginMethod
    fun updateCallSession(call: PluginCall) {
        nativeCallControl.updateCallSession(
            mode = call.getString("mode") ?: "voice",
            useSpeaker = call.getBoolean("useSpeaker", false) == true,
            enableProximityMonitoring = call.getBoolean("enableProximityMonitoring", false) == true,
            keepScreenAwake = call.getBoolean("keepScreenAwake", false) == true,
        )
        call.resolve(JSObject())
    }

    @PluginMethod
    fun endCallSession(call: PluginCall) {
        nativeCallControl.endCallSession()
        call.resolve(JSObject())
    }
}
