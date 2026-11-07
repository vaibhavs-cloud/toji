package ch.duartesantos.opengym;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.app.usage.UsageEvents;
import android.app.usage.UsageStats;
import android.app.usage.UsageStatsManager;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.content.pm.ResolveInfo;
import android.content.pm.ServiceInfo;
import android.os.Build;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.os.VibrationEffect;
import android.os.Vibrator;
import android.provider.MediaStore;
import android.telecom.TelecomManager;
import androidx.core.app.NotificationCompat;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

/**
 * Foreground Service that enforces distraction blocking (Forest-style) during
 * active rest timers. Monitors foreground app changes via UsageStatsManager
 * and triggers DistractionOverlayActivity when a blocklisted app is launched.
 */
public class DistractionBlockerService extends Service {
    public static final String ACTION_START = "ch.duartesantos.opengym.START_BLOCKING";
    public static final String ACTION_STOP = "ch.duartesantos.opengym.STOP_BLOCKING";
    public static final String EXTRA_REST_SECONDS = "rest_seconds";
    public static final String EXTRA_BLOCKLIST = "blocklist";

    private static final String CHANNEL_ID = "toji-rest-guard";
    private static final int NOTIFICATION_ID = 8842;
    private static final long POLL_INTERVAL_MS = 500;

    private static volatile boolean active = false;
    private static volatile long currentEndsAt = 0;

    private final Handler handler = new Handler(Looper.getMainLooper());
    private final Set<String> allowlist = new HashSet<>();
    private final Set<String> customBlocklist = new HashSet<>();
    private boolean blockAllNonAllowlisted = false;
    private long endsAtMillis = 0;
    private String lastInterceptedPackage = null;
    private long lastInterceptTime = 0;

    private static final Set<String> DEFAULT_DISTRACTIONS = new HashSet<>(Arrays.asList(
            "com.instagram.android",
            "com.zhiliaoapp.musically",
            "com.ss.android.ugc.trill",
            "com.twitter.android",
            "com.x.android",
            "com.facebook.katana",
            "com.facebook.orca",
            "com.reddit.frontpage",
            "com.snapchat.android",
            "com.google.android.youtube",
            "com.netflix.mediaclient",
            "com.pinterest",
            "com.discord"
    ));

    public static boolean isActive() {
        return active && System.currentTimeMillis() < currentEndsAt;
    }

    public static long getRemainingSeconds() {
        if (!isActive()) return 0;
        long diff = (currentEndsAt - System.currentTimeMillis()) / 1000;
        return Math.max(0, diff);
    }

    public static void start(Context context, int restSeconds, ArrayList<String> blocklist) {
        Intent intent = new Intent(context, DistractionBlockerService.class);
        intent.setAction(ACTION_START);
        intent.putExtra(EXTRA_REST_SECONDS, restSeconds);
        if (blocklist != null) {
            intent.putStringArrayListExtra(EXTRA_BLOCKLIST, blocklist);
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            context.startForegroundService(intent);
        } else {
            context.startService(intent);
        }
    }

    public static void stop(Context context) {
        Intent intent = new Intent(context, DistractionBlockerService.class);
        intent.setAction(ACTION_STOP);
        context.startService(intent);
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    @Override
    public void onCreate() {
        super.onCreate();
        createNotificationChannel();
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent == null || ACTION_STOP.equals(intent.getAction())) {
            stopBlocking();
            return START_NOT_STICKY;
        }

        if (ACTION_START.equals(intent.getAction())) {
            int restSeconds = intent.getIntExtra(EXTRA_REST_SECONDS, 60);
            ArrayList<String> blocklist = intent.getStringArrayListExtra(EXTRA_BLOCKLIST);
            startBlocking(restSeconds, blocklist);
        }

        return START_NOT_STICKY;
    }

    private void startBlocking(int restSeconds, ArrayList<String> blocklist) {
        endsAtMillis = System.currentTimeMillis() + (restSeconds * 1000L);
        currentEndsAt = endsAtMillis;
        active = true;

        customBlocklist.clear();
        blockAllNonAllowlisted = false;

        if (blocklist != null && !blocklist.isEmpty()) {
            for (String item : blocklist) {
                if ("*".equals(item) || "all".equalsIgnoreCase(item)) {
                    blockAllNonAllowlisted = true;
                } else if (item != null && !item.trim().isEmpty()) {
                    customBlocklist.add(item.trim());
                }
            }
        }

        populateAllowlist();

        Notification notification = buildNotification(restSeconds);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
            startForeground(NOTIFICATION_ID, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE);
        } else {
            startForeground(NOTIFICATION_ID, notification);
        }

        handler.removeCallbacks(monitorRunnable);
        handler.post(monitorRunnable);
    }

    private void stopBlocking() {
        active = false;
        currentEndsAt = 0;
        handler.removeCallbacks(monitorRunnable);
        stopForeground(true);
        stopSelf();
    }

    private final Runnable monitorRunnable = new Runnable() {
        @Override
        public void run() {
            if (!active) return;
            long now = System.currentTimeMillis();
            if (now >= endsAtMillis) {
                stopBlocking();
                return;
            }

            checkForegroundApp();
            handler.postDelayed(this, POLL_INTERVAL_MS);
        }
    };

    private void checkForegroundApp() {
        String currentPkg = getForegroundPackage();
        if (currentPkg == null) return;

        if (isDistraction(currentPkg)) {
            long now = System.currentTimeMillis();
            // Debounce: don't re-trigger within 2 seconds for the same package
            if (currentPkg.equals(lastInterceptedPackage) && (now - lastInterceptTime) < 2000) {
                return;
            }

            lastInterceptedPackage = currentPkg;
            lastInterceptTime = now;

            triggerVibration();
            DistractionOverlayActivity.show(this, endsAtMillis, currentPkg);
        }
    }

    private boolean isDistraction(String pkg) {
        if (pkg == null || pkg.isEmpty()) return false;
        if (allowlist.contains(pkg)) return false;

        if (blockAllNonAllowlisted) {
            return true;
        }

        if (!customBlocklist.isEmpty()) {
            return customBlocklist.contains(pkg);
        }

        return DEFAULT_DISTRACTIONS.contains(pkg);
    }

    private String getForegroundPackage() {
        UsageStatsManager usm = (UsageStatsManager) getSystemService(Context.USAGE_STATS_SERVICE);
        if (usm == null) return null;

        long time = System.currentTimeMillis();
        UsageEvents events = usm.queryEvents(time - 8000, time);
        if (events != null) {
            UsageEvents.Event event = new UsageEvents.Event();
            String lastPackage = null;
            while (events.hasNextEvent()) {
                events.getNextEvent(event);
                if (event.getEventType() == UsageEvents.Event.ACTIVITY_RESUMED) {
                    lastPackage = event.getPackageName();
                }
            }
            if (lastPackage != null) return lastPackage;
        }

        // Fallback using queryUsageStats
        List<UsageStats> statsList = usm.queryUsageStats(UsageStatsManager.INTERVAL_DAILY, time - 60000, time);
        if (statsList != null && !statsList.isEmpty()) {
            UsageStats recent = null;
            for (UsageStats s : statsList) {
                if (recent == null || s.getLastTimeUsed() > recent.getLastTimeUsed()) {
                    recent = s;
                }
            }
            if (recent != null) return recent.getPackageName();
        }

        return null;
    }

    private void populateAllowlist() {
        allowlist.clear();
        // 1. Toji itself
        allowlist.add(getPackageName());

        // 2. System UI and critical Android surfaces
        allowlist.add("com.android.systemui");
        allowlist.add("android");
        allowlist.add("com.android.settings");
        allowlist.add("com.google.android.settings");

        PackageManager pm = getPackageManager();

        // 3. Launchers / Home
        Intent homeIntent = new Intent(Intent.ACTION_MAIN);
        homeIntent.addCategory(Intent.CATEGORY_HOME);
        List<ResolveInfo> launchers = pm.queryIntentActivities(homeIntent, PackageManager.MATCH_DEFAULT_ONLY);
        if (launchers != null) {
            for (ResolveInfo info : launchers) {
                if (info.activityInfo != null) {
                    allowlist.add(info.activityInfo.packageName);
                }
            }
        }

        // 4. Default Dialer & Phone
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            TelecomManager telecom = (TelecomManager) getSystemService(Context.TELECOM_SERVICE);
            if (telecom != null) {
                String defaultDialer = telecom.getDefaultDialerPackage();
                if (defaultDialer != null) allowlist.add(defaultDialer);
            }
        }
        allowlist.add("com.android.dialer");
        allowlist.add("com.google.android.dialer");
        allowlist.add("com.android.phone");
        allowlist.add("com.samsung.android.dialer");

        // 5. Emergency Apps
        allowlist.add("com.android.emergency");
        allowlist.add("com.google.android.apps.safetyhub");
        allowlist.add("com.sec.android.app.safetyhub");

        // 6. Camera Apps
        Intent cameraIntent = new Intent(MediaStore.ACTION_IMAGE_CAPTURE);
        List<ResolveInfo> cameras = pm.queryIntentActivities(cameraIntent, PackageManager.MATCH_DEFAULT_ONLY);
        if (cameras != null) {
            for (ResolveInfo info : cameras) {
                if (info.activityInfo != null) {
                    allowlist.add(info.activityInfo.packageName);
                }
            }
        }
        allowlist.add("com.android.camera");
        allowlist.add("com.google.android.GoogleCamera");
        allowlist.add("com.sec.android.app.camera");

        // 7. Music & Audio Players
        Intent musicIntent = new Intent(Intent.ACTION_MAIN);
        musicIntent.addCategory(Intent.CATEGORY_APP_MUSIC);
        List<ResolveInfo> musicApps = pm.queryIntentActivities(musicIntent, 0);
        if (musicApps != null) {
            for (ResolveInfo info : musicApps) {
                if (info.activityInfo != null) {
                    allowlist.add(info.activityInfo.packageName);
                }
            }
        }
        allowlist.add("com.spotify.music");
        allowlist.add("com.google.android.apps.youtube.music");
        allowlist.add("com.apple.android.music");
        allowlist.add("com.amazon.mp3");
        allowlist.add("com.soundcloud.android");
        allowlist.add("com.deezer.android.app");
        allowlist.add("au.com.shiftyjelly.pocketcasts");
    }

    private void triggerVibration() {
        try {
            Vibrator vibrator = (Vibrator) getSystemService(Context.VIBRATOR_SERVICE);
            if (vibrator != null && vibrator.hasVibrator()) {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    vibrator.vibrate(VibrationEffect.createOneShot(250, VibrationEffect.DEFAULT_AMPLITUDE));
                } else {
                    vibrator.vibrate(250);
                }
            }
        } catch (Exception ignored) {
        }
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                    CHANNEL_ID,
                    "Toji Rest Guard",
                    NotificationManager.IMPORTANCE_LOW
            );
            channel.setDescription("Monitors distracting apps during rest timer.");
            channel.setShowBadge(false);
            NotificationManager nm = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
            if (nm != null) {
                nm.createNotificationChannel(channel);
            }
        }
    }

    private Notification buildNotification(int restSeconds) {
        Intent tojiIntent = new Intent(this, MainActivity.class);
        tojiIntent.addFlags(Intent.FLAG_ACTIVITY_REORDER_TO_FRONT | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        PendingIntent pi = PendingIntent.getActivity(
                this,
                0,
                tojiIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M ? PendingIntent.FLAG_IMMUTABLE : 0)
        );

        return new NotificationCompat.Builder(this, CHANNEL_ID)
                .setSmallIcon(R.mipmap.ic_launcher)
                .setContentTitle("Toji Rest Guard Active")
                .setContentText("Recovery in progress (" + restSeconds + "s) — Distractions blocked")
                .setContentIntent(pi)
                .setOngoing(true)
                .setPriority(NotificationCompat.PRIORITY_LOW)
                .build();
    }

    @Override
    public void onDestroy() {
        active = false;
        currentEndsAt = 0;
        handler.removeCallbacks(monitorRunnable);
        super.onDestroy();
    }
}
