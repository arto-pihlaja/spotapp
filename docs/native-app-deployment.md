# Deploy SpotApp as a Native App for Test Users

Guide for building and distributing standalone native builds (iOS + Android) to a small group of test users (<10) using Expo EAS Build with internal distribution.

## Prerequisites

### Accounts

| Account | Cost | Required For | Sign Up |
|---------|------|-------------|---------|
| Expo | Free | All builds | [expo.dev](https://expo.dev) |
| Apple Developer Program | $99/yr | iOS builds + distribution | [developer.apple.com](https://developer.apple.com/programs/) |
| Google Play Console | Not needed | N/A for <10 users (APK sideloading) | — |

### Backend

- Railway deployment must be stable and accessible at a public URL
- You will need the Railway URL (e.g., `https://your-app.up.railway.app`) for the steps below

### Tools

EAS CLI should already be installed globally. If not:

```bash
npm install -g eas-cli
```

## Step 1: Expo Login & Project Setup

```bash
# Log in to your Expo account
npx eas login

# Link the project (if not already linked)
npx eas init
```

## Step 2: Update API URLs in `eas.json`

Replace the placeholder URLs with your actual Railway backend URL:

```json
// In eas.json, update these values:
"preview" → "EXPO_PUBLIC_API_BASE_URL": "https://YOUR-APP.up.railway.app"
"production" → "EXPO_PUBLIC_API_BASE_URL": "https://YOUR-APP.up.railway.app"
```

## Step 3: Build for Android

Android builds work immediately — EAS manages keystores automatically.

```bash
eas build --profile preview --platform android
```

- The `preview` profile is configured with `"buildType": "apk"` so testers get a directly installable file (not an AAB which requires the Play Store)
- After the build completes, EAS provides a download URL

### Distribute to Android testers

1. Share the EAS download URL with testers
2. Testers tap the link to download the APK
3. Testers may need to enable **"Install from unknown sources"** in their device settings
4. Tap the downloaded APK to install

## Step 4: Build for iOS (After Apple Developer Enrollment)

iOS requires additional setup due to Apple's code signing requirements.

### 4a. Register test devices

Each tester's iPhone UDID must be registered:

```bash
eas device:create
```

This generates a registration URL. Share it with testers — they open it on their iPhone to register their device.

### 4b. Set up credentials

```bash
eas credentials
```

EAS will walk you through creating an Ad Hoc provisioning profile for internal distribution.

### 4c. Build

```bash
eas build --profile preview --platform ios
```

- Produces an `.ipa` signed for registered devices
- EAS hosts the build and provides an install link

### Distribute to iOS testers

1. Share the EAS install URL with testers
2. Testers open the URL on their registered iPhone and tap **Install**

**Alternative (more polished):** Upload to TestFlight for a smoother install experience:

```bash
eas submit --platform ios
```

This requires App Store Connect setup but gives testers a familiar install flow.

## Step 5: Push Updates (After Initial Install)

For JS-only changes (no native module changes), push over-the-air updates without rebuilding:

```bash
eas update --branch preview --message "Description of changes"
```

Testers receive the update next time they open the app.

## Build Profiles Reference

| Profile | Use Case | Distribution | Android Output |
|---------|----------|-------------|----------------|
| `development` | Dev with hot-reload | Internal | — |
| `preview` | Test builds for testers | Internal (ad-hoc) | APK |
| `production` | Store release | Store | AAB |

## Verification Checklist

- [ ] `npm run validate` passes
- [ ] `eas.json` has real Railway URL (not `spotsapp.example.com`)
- [ ] Android build succeeds on EAS
- [ ] APK installs and launches on Android device
- [ ] App connects to Railway backend (login, create spots, map works)
- [ ] (After Apple enrollment) iOS build succeeds on EAS
- [ ] iOS app installs via EAS link on registered iPhone
- [ ] Same functionality verified on iOS

## Troubleshooting

### Build fails on EAS
- Check `eas.json` syntax and environment variables
- Run `eas build --profile preview --platform android --local` to debug locally (requires Android SDK)

### App can't reach backend
- Verify the Railway URL is correct and the server is running
- Check that `EXPO_PUBLIC_API_BASE_URL` is set in the correct build profile
- Ensure Railway allows requests from mobile clients (CORS may not apply to native, but check any IP allowlists)

### iOS install fails
- Ensure the tester's device UDID is registered (`eas device:list` to check)
- Rebuild after registering new devices — the provisioning profile must include them
