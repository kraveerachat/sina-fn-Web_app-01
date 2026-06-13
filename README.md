# Sina_FN — Enterprise Hybrid Ingestion System

Sina_FN is a personal finance aggregator and reconciliation suite consisting of:
1. **`sina-fn-web`** (Web Command Center): A Next.js 16 Web portal.
2. **`sina-fn-mobile`** (Edge Ingestion Client): A React Native CLI mobile app.

---

## 1. Web Module Setup (`sina-fn-web`)

First, install dependencies and run the Next.js development server:

```bash
cd sina-fn-web
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the Web dashboard.

### Environment Variables
Create a `.env.local` file in the web folder:
```env
NEXT_PUBLIC_SUPABASE_URL=https://<your-project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
GOOGLE_GENERATIVE_AI_API_KEY=AIzaSy...
```

---

## 2. Mobile Module Setup (`sina-fn-mobile`)

The mobile client is built using React Native CLI.

### Initialization & Commands
To initialize a fresh development build:
```bash
# Create React Native workspace (for reference)
npx @react-native-community/cli@latest init sina_fn_mobile --directory mobile

# Install dependencies
cd mobile
npm install

# Run on Android emulator / device
npm run android

# Run on iOS simulator / device
npm run ios
```

### Core Dependencies
Ensure these modules are configured in `package.json`:
*   `react-native-android-notification-listener` (Background push alert capture)
*   `react-native-vision-camera` (Targeted receipt capture)
*   `react-native-webview` (Bento dashboard integration)
*   `@supabase/supabase-js` (Direct client-side queries)
*   `zustand` (State management)

### Native Android Permissions & Services
The application requires the following permissions in `android/app/src/main/AndroidManifest.xml`:

```xml
<!-- Permission to capture push alerts in background -->
<uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />

<!-- Camera access for receipt scanning -->
<uses-permission android:name="android.permission.CAMERA" />

<!-- Background service declaration -->
<service android:name="com.github.wumke.RNAndroidNotificationListener.RNAndroidNotificationListener"
    android:label="Sina Bank Alert Listener"
    android:permission="android.permission.BIND_NOTIFICATION_LISTENER_SERVICE"
    android:exported="true">
    <intent-filter>
        <action android:name="android.service.notification.NotificationListenerService" />
    </intent-filter>
</service>
```

### Mobile Environment Variables
Configure your mobile config variables (e.g. `.env` or configuration file):
*   `SUPABASE_URL`: Supabase project URL (must match the web app config).
*   `SUPABASE_ANON_KEY`: Supabase anonymous token key.
*   `WEB_APP_URL`: The URL of the hosted Next.js web application (used by `react-native-webview` to load the responsive bento grid).

---

## 3. Testing Procedures

### A. Permission Onboarding Flow Testing
1.  **Fresh Install**: Install the app on an Android device/emulator. On the welcome screen, you should be redirected to the **Permission Onboarding Flow** if Notification Access is not granted.
2.  **Toggle Settings**: Tap the "อนุมัติสิทธิ์ดักฟังแจ้งเตือน" button. Verify that the app opens Android's native Notification Access Settings page.
3.  **Grant Permission**: Toggle the switch for "Sina Bank Alert Listener" to **ON**.
4.  **Auto Detect Status**: Press back to return to the app. Verify that the UI automatically detects the status change, shows a green confirmation checkmark, and unlocks the main interface.

### B. Targeted OCR Scan & Ingestion Testing
1.  **Simulate Notification**: Trigger a banking SMS or push notification. Check if the app intercepts it and inserts a row in Supabase with `status: 'pending_scan'`.
2.  **Capture Receipt**: Tap the pending card in the Mobile Inbox. Vision Camera viewfinder will appear. Snap a photo of the receipt.
3.  **Upload & Scan**: Ensure the photo uploads to Supabase Storage and triggers the `/api/ai/scan-receipt` webhook, updating the database status to `'completed'` and parsing items.
