package com.usmoment.app.nativecall;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "NativeCallControl")
public class NativeCallControlPlugin extends Plugin {
    private NativeCallControl nativeCallControl;

    @Override
    public void load() {
        nativeCallControl = new NativeCallControl(getContext());
    }

    @PluginMethod
    public void startCallSession(PluginCall call) {
        nativeCallControl.startCallSession(
            call.getString("mode", "voice"),
            call.getBoolean("useSpeaker", false),
            call.getBoolean("enableProximityMonitoring", false),
            call.getBoolean("keepScreenAwake", false)
        );
        call.resolve(new JSObject());
    }

    @PluginMethod
    public void updateCallSession(PluginCall call) {
        nativeCallControl.updateCallSession(
            call.getString("mode", "voice"),
            call.getBoolean("useSpeaker", false),
            call.getBoolean("enableProximityMonitoring", false),
            call.getBoolean("keepScreenAwake", false)
        );
        call.resolve(new JSObject());
    }

    @PluginMethod
    public void endCallSession(PluginCall call) {
        nativeCallControl.endCallSession();
        call.resolve(new JSObject());
    }
}
