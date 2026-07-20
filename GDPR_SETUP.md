# Google User Messaging Platform (UMP) SDK Setup Guide

## Overview
This guide provides step-by-step instructions for building and testing the Google User Messaging Platform (UMP) SDK implementation for GDPR compliance in the Smart Music Player app.

## Prerequisites
- Expo SDK 51
- React Native development environment set up
- Android Studio (for Android testing) or Xcode (for iOS testing)
- EAS CLI installed (`npm install -g @expo/eas-cli`)

## Installation and Build Instructions

### 1. Install Dependencies
The `react-native-google-mobile-ads` package is already included, but verify installation:

```bash
# Verify the dependency is installed
npx expo install react-native-google-mobile-ads

# Install other dependencies if needed
npm install
```

### 2. Generate Native Code
Since UMP SDK requires native modules, you need to generate native code (can't use Expo Go):

```bash
# Clean and generate fresh native code with updated UMP configuration
npx expo prebuild --clean

# This will:
# - Apply the delay_app_measurement_init: true setting
# - Add iOS tracking usage description
# - Configure AdMob app IDs
# - Set up Android Proguard rules automatically
```

### 3. Build Development Client

#### Android Development Build
```bash
# Option 1: Local build (requires Android Studio)
npx expo run:android

# Option 2: EAS Development Build (cloud build)
npm run eas:build:dev:android
```

#### iOS Development Build
```bash
# Option 1: Local build (requires Xcode)
npx expo run:ios

# Option 2: EAS Development Build (cloud build)
npm run eas:build:dev:ios
```

### 4. Install and Run
After building, install the APK/IPA on your device and run the app.

## Testing Scenarios

### 1. First Launch Testing

#### Test Case 1: EEA User (Consent Required)
```bash
# To test with debug geography, you can modify the consent check in AdConsentProvider.tsx
# Add this to requestInfoUpdate() call:
# const consentInfo = await AdsConsent.requestInfoUpdate({
#   debugGeography: AdsConsentDebugGeography.EEA,
#   testDeviceIdentifiers: ['YOUR_DEVICE_ID'], // Optional
# });
```

**Expected Behavior:**
1. App shows "Loading privacy preferences..." screen
2. Google's consent form appears
3. User makes choice (Accept/Reject)
4. App continues to main screen
5. Toast shows "Privacy preferences saved"
6. Check logs: `[AdConsent] Final consent status:`

#### Test Case 2: Non-EEA User (Consent Not Required)
**Expected Behavior:**
1. Brief "Loading privacy preferences..." screen
2. No consent form appears
3. App continues to main screen normally
4. Check logs: `[AdConsent] Consent not required`

#### Test Case 3: Network Error
**Expected Behavior:**
1. Brief loading screen
2. Alert appears: "Privacy Notice - Could not load privacy preferences... The app will continue normally"
3. App continues to main screen
4. Ads remain disabled

### 2. Subsequent Launch Testing
**Expected Behavior:**
1. App launches normally (no loading screen)
2. No consent form appears
3. Previous consent settings are preserved
4. Check logs: Should see skipped UMP check message

### 3. Privacy Options Testing
Navigate to Settings > Privacy & Data (if visible):

**Expected Behavior:**
1. Menu item only appears for users in consent regions
2. Tapping opens Google's privacy options form
3. After interaction, toast shows "Privacy preferences updated"
4. Changes are applied immediately

### 4. Ads Integration Testing
Check that ads respect consent:

**When Consent Granted:**
- Ads should initialize normally
- Check logs: `[Ads] Consent allows ads - initializing SDK...`
- App open ads, native ads should work

**When Consent Denied:**
- Ads should not initialize
- Check logs: `[Ads] Consent not granted - skipping ads initialization`
- No ads should appear in the app

## Debugging

### Enable Debug Logging
All consent-related logs are prefixed with `[AdConsent]` or `[Ads]`. Monitor these in your development console.

### Reset Consent (For Testing)
To reset consent and test first-launch flow again:

```javascript
// In your app or via console
import { StorageService } from '@/services/StorageService';
import { StorageKeys } from '@/constants/audio';

// Clear stored consent
await StorageService.remove(StorageKeys.consentChecked);

// Or reset UMP state (test devices only)
import { AdsConsent } from 'react-native-google-mobile-ads';
await AdsConsent.reset();
```

### Test Device Setup
For reliable testing, add your device as a test device in AdMob console and use debug geography settings.

## Production Checklist

Before releasing to production:

- [ ] Remove any debug geography settings
- [ ] Remove test device identifiers
- [ ] Test on real devices in different regions (EEA vs non-EEA)
- [ ] Verify privacy policy links work
- [ ] Test privacy revocation flow
- [ ] Verify ads load correctly after consent
- [ ] Test app behavior when consent is denied
- [ ] Run release build to ensure Proguard doesn't break UMP SDK

## Troubleshooting

### Common Issues

**Issue: "Module not found" error for AdsConsent**
- Solution: Run `npx expo prebuild --clean` and rebuild

**Issue: Consent form doesn't appear**
- Check if you're in a region requiring consent
- Use debug geography for testing
- Verify AdMob account has GDPR messaging configured

**Issue: App crashes on consent check**
- Check logs for specific error
- Ensure internet connection is available
- Verify app IDs in app.json are correct

**Issue: Privacy options not available**
- This is normal for users outside consent regions
- The menu item should not appear for these users

## File Structure

The implementation consists of:

- `app.json` - UMP SDK configuration
- `src/components/AdConsentProvider.tsx` - Main consent logic
- `src/services/ads.ts` - Ads initialization with consent check
- `app/settings/index.tsx` - Privacy options menu
- `src/constants/audio.ts` - Storage key constants

## Support

For issues with the UMP SDK itself, refer to:
- [Google UMP SDK Documentation](https://developers.google.com/admob/ump)
- [React Native Google Mobile Ads Documentation](https://docs.page/invertase/react-native-google-mobile-ads)