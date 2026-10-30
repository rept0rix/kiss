package online.sendkiss.app;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(KissContactsPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
