package com.usmoment.app;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;
import com.usmoment.app.nativecall.NativeCallControlPlugin;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(NativeCallControlPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
