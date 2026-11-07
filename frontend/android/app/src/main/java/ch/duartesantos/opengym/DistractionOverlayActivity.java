package ch.duartesantos.opengym;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageManager;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.view.WindowManager;
import android.widget.Button;
import android.widget.TextView;
import java.util.Locale;

/**
 * Full-screen alert overlay displayed when a distracting / blocklisted app
 * is opened during an active rest timer. Follows strict Toji dark manga aesthetic:
 * #0B0B0D void, #17181C surface, #F4F1EA off-white text, #C1121F blood-red accent.
 */
public class DistractionOverlayActivity extends Activity {
    public static final String EXTRA_ENDS_AT = "ends_at";
    public static final String EXTRA_BLOCKED_PKG = "blocked_pkg";

    private final Handler ticker = new Handler(Looper.getMainLooper());
    private long endsAt = 0;
    private TextView tvCountdown;
    private TextView tvBlockedApp;
    private boolean isRunning = false;

    private final Runnable tickRunnable = new Runnable() {
        @Override
        public void run() {
            if (!isRunning) return;
            long now = System.currentTimeMillis();
            long diffSec = (endsAt - now) / 1000;
            if (diffSec <= 0) {
                if (tvCountdown != null) tvCountdown.setText("00:00");
                returnToToji();
                return;
            }
            long minutes = diffSec / 60;
            long seconds = diffSec % 60;
            if (tvCountdown != null) {
                tvCountdown.setText(String.format(Locale.US, "%02d:%02d", minutes, seconds));
            }
            ticker.postDelayed(this, 1000);
        }
    };

    public static void show(Context context, long endsAtMillis, String blockedPackage) {
        Intent intent = new Intent(context, DistractionOverlayActivity.class);
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_REORDER_TO_FRONT);
        intent.putExtra(EXTRA_ENDS_AT, endsAtMillis);
        intent.putExtra(EXTRA_BLOCKED_PKG, blockedPackage);
        context.startActivity(intent);
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        configureWindow();
        setContentView(R.layout.activity_distraction_overlay);

        tvCountdown = findViewById(R.id.tv_countdown);
        tvBlockedApp = findViewById(R.id.tv_blocked_app);
        Button btnReturn = findViewById(R.id.btn_return_to_toji);
        TextView btnEmergency = findViewById(R.id.btn_emergency_exit);

        extractIntentData(getIntent());

        if (btnReturn != null) {
            btnReturn.setOnClickListener(v -> returnToToji());
        }

        if (btnEmergency != null) {
            btnEmergency.setOnClickListener(v -> {
                DistractionBlockerService.stop(this);
                finish();
            });
        }
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        extractIntentData(intent);
    }

    private void extractIntentData(Intent intent) {
        if (intent != null) {
            endsAt = intent.getLongExtra(EXTRA_ENDS_AT, System.currentTimeMillis() + 60000);
            String pkg = intent.getStringExtra(EXTRA_BLOCKED_PKG);
            if (pkg != null && tvBlockedApp != null) {
                String appLabel = resolveAppLabel(pkg);
                tvBlockedApp.setText("Rest timer still running — return to Toji (" + appLabel + " blocked)");
            }
        }
    }

    private String resolveAppLabel(String packageName) {
        PackageManager pm = getPackageManager();
        try {
            ApplicationInfo info = pm.getApplicationInfo(packageName, 0);
            CharSequence label = pm.getApplicationLabel(info);
            return label != null ? label.toString() : packageName;
        } catch (Exception e) {
            return packageName;
        }
    }

    private void configureWindow() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
            setShowWhenLocked(true);
            setTurnScreenOn(true);
        } else {
            getWindow().addFlags(
                WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED |
                WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON
            );
        }
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
    }

    @Override
    protected void onResume() {
        super.onResume();
        isRunning = true;
        ticker.removeCallbacks(tickRunnable);
        ticker.post(tickRunnable);
    }

    @Override
    protected void onPause() {
        super.onPause();
        isRunning = false;
        ticker.removeCallbacks(tickRunnable);
    }

    @Override
    public void onBackPressed() {
        // Back press returns directly to Toji instead of returning to the distracted app
        returnToToji();
    }

    private void returnToToji() {
        isRunning = false;
        ticker.removeCallbacks(tickRunnable);
        Intent intent = new Intent(this, MainActivity.class);
        intent.addFlags(Intent.FLAG_ACTIVITY_REORDER_TO_FRONT | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        startActivity(intent);
        finish();
    }
}
