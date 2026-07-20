const { withAndroidManifest } = require('@expo/config-plugins');

/**
 * Custom Expo config plugin to handle screen orientation for different device types.
 * - Small screens (phones): Portrait only
 * - Large screens (tablets/foldables): All orientations allowed
 * 
 * This fixes the Google Play Console warning about orientation restrictions on large screens.
 */
module.exports = function withAndroidOrientationPlugin(config) {
  return withAndroidManifest(config, async (config) => {
    const androidManifest = config.modResults;
    const mainApplication = androidManifest.manifest.application?.[0];

    if (mainApplication?.activity) {
      mainApplication.activity.forEach((activity) => {
        // Remove portrait orientation restriction from MainActivity
        if (activity.$['android:name'] === '.MainActivity') {
          delete activity.$['android:screenOrientation'];
        }
        
        // Also remove from ML Kit barcode scanner if present
        if (activity.$['android:name']?.includes('GmsBarcodeScanningDelegateActivity')) {
          delete activity.$['android:screenOrientation'];
        }
      });
    }

    return config;
  });
};
