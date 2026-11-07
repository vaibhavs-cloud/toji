package ch.duartesantos.opengym;

import android.app.AppOpsManager;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.util.ArrayList;
import org.json.JSONException;

/**
 * Capacitor plugin for rest timer distraction blocking and app interception.
 * Exposes methods to manage Forest-style blocking during workout rest periods.
 */
@CapacitorPlugin(name = "DistractionBlocker")
public class DistractionBlockerPlugin extends Plugin {

    public static boolean hasUsageStatsPermission(Context context) {
        if (context == null) return false;
        try {
            AppOpsManager appOps = (AppOpsManager) context.getSystemService(Context.APP_OPS_SERVICE);
            if (appOps == null) return false;
            int mode = appOps.checkOpNoThrow(
                    AppOpsManager.OPSTR_GET_USAGE_STATS,
                    android.os.Process.myUid(),
                    context.getPackageName()
            );
            return mode == AppOpsManager.MODE_ALLOWED;
        } catch (Exception e) {
            return false;
        }
    }

    public static boolean hasOverlayPermission(Context context) {
        if (context == null) return false;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            return Settings.canDrawOverlays(context);
        }
        return true;
    }

    @PluginMethod
    public void isUsagePermissionGranted(PluginCall call) {
        Context context = getContext();
        boolean usageStats = hasUsageStatsPermission(context);
        boolean overlay = hasOverlayPermission(context);

        JSObject ret = new JSObject();
        ret.put("granted", usageStats);
        ret.put("usageStats", usageStats);
        ret.put("overlay", overlay);
        call.resolve(ret);
    }

    @PluginMethod
    public void requestUsagePermission(PluginCall call) {
        Context context = getContext();
        if (context == null) {
            call.reject("No context available");
            return;
        }
        try {
            Intent intent = new Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS);
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            context.startActivity(intent);
            JSObject ret = new JSObject();
            ret.put("opened", true);
            call.resolve(ret);
        } catch (Exception e) {
            call.reject("Failed to open usage access settings: " + e.getMessage());
        }
    }

    @PluginMethod
    public void requestOverlayPermission(PluginCall call) {
        Context context = getContext();
        if (context == null) {
            call.reject("No context available");
            return;
        }
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                Intent intent = new Intent(
                        Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                        Uri.parse("package:" + context.getPackageName())
                );
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                context.startActivity(intent);
            }
            JSObject ret = new JSObject();
            ret.put("opened", true);
            call.resolve(ret);
        } catch (Exception e) {
            call.reject("Failed to open overlay settings: " + e.getMessage());
        }
    }

    @PluginMethod
    public void startBlocking(PluginCall call) {
        Context context = getContext();
        if (context == null) {
            call.reject("No context available");
            return;
        }

        int restSeconds = call.getInt("restSeconds", call.getInt("seconds", 60));
        if (restSeconds <= 0) {
            call.reject("restSeconds must be greater than 0");
            return;
        }

        ArrayList<String> blocklist = new ArrayList<>();
        JSArray arr = call.getArray("blocklist");
        if (arr != null) {
            for (int i = 0; i < arr.length(); i++) {
                try {
                    String item = arr.getString(i);
                    if (item != null && !item.trim().isEmpty()) {
                        blocklist.add(item.trim());
                    }
                } catch (JSONException ignored) {
                }
            }
        }

        DistractionBlockerService.start(context, restSeconds, blocklist);

        JSObject ret = new JSObject();
        ret.put("active", true);
        ret.put("restSeconds", restSeconds);
        ret.put("blocklistCount", blocklist.size());
        call.resolve(ret);
    }

    @PluginMethod
    public void stopBlocking(PluginCall call) {
        Context context = getContext();
        if (context != null) {
            DistractionBlockerService.stop(context);
        }
        JSObject ret = new JSObject();
        ret.put("active", false);
        call.resolve(ret);
    }

    @PluginMethod
    public void getStatus(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("active", DistractionBlockerService.isActive());
        ret.put("remainingSeconds", DistractionBlockerService.getRemainingSeconds());
        ret.put("usagePermission", hasUsageStatsPermission(getContext()));
        ret.put("overlayPermission", hasOverlayPermission(getContext()));
        call.resolve(ret);
    }
}
