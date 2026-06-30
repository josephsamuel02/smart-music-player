import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import {
  NativeAd,
  NativeAdView,
  NativeAsset,
  NativeAssetType,
  NativeMediaView,
} from 'react-native-google-mobile-ads';
import { Artwork } from '@/components/Artwork';
import { Colors } from '@/constants/colors';
import { FontSize, FontWeight } from '@/constants/theme';
import { ADS_ENABLED, AD_INTERVAL_MS, AD_VISIBLE_MS, NATIVE_AD_UNIT_ID } from '@/constants/ads';

type Props = {
  uri?: string | null;
  seed: string;
  size: number;
  radius: number;
  style?: ViewStyle;
};

/**
 * The square artwork box on the player screen. Shows the album art and, every
 * `AD_INTERVAL_MS`, briefly flips to a native AdMob ad (for `AD_VISIBLE_MS`)
 * before flipping back. Ads are loaded best-effort; if none fill, the box just
 * keeps showing the album art.
 */
export function PlayerArtworkAd({ uri, seed, size, radius, style }: Props) {
  const [ad, setAd] = useState<NativeAd | null>(null);
  const [showAd, setShowAd] = useState(false);

  // Keep the latest loaded ad in a ref for the cycle/cleanup logic.
  const adRef = useRef<NativeAd | null>(null);

  useEffect(() => {
    if (!ADS_ENABLED) return;

    let cancelled = false;
    let visibleTimer: ReturnType<typeof setTimeout> | null = null;
    let cycleTimer: ReturnType<typeof setInterval> | null = null;

    const preload = async () => {
      try {
        const next = await NativeAd.createForAdRequest(NATIVE_AD_UNIT_ID);
        if (cancelled) {
          next.destroy();
          return;
        }
        // Replace any previously loaded (and now unused) ad.
        if (adRef.current) adRef.current.destroy();
        adRef.current = next;
        setAd(next);
      } catch {
        // No fill / SDK unavailable - try again on the next cycle.
      }
    };

    const runCycle = () => {
      if (cancelled) return;
      if (adRef.current) {
        setShowAd(true);
        visibleTimer = setTimeout(() => {
          if (cancelled) return;
          setShowAd(false);
          // Preload a fresh ad for the next cycle after this one hides.
          void preload();
        }, AD_VISIBLE_MS);
      } else {
        // Nothing ready yet; make sure something is loading for next time.
        void preload();
      }
    };

    void preload();
    cycleTimer = setInterval(runCycle, AD_INTERVAL_MS);

    return () => {
      cancelled = true;
      if (visibleTimer) clearTimeout(visibleTimer);
      if (cycleTimer) clearInterval(cycleTimer);
      if (adRef.current) {
        adRef.current.destroy();
        adRef.current = null;
      }
    };
  }, []);

  return (
    <View style={[{ width: size, height: size, borderRadius: radius }, styles.box, style]}>
      <Artwork uri={uri} seed={seed} size={size} radius={radius} />
      {showAd && ad ? (
        <Animated.View
          entering={FadeIn.duration(280)}
          exiting={FadeOut.duration(280)}
          style={[StyleSheet.absoluteFill, { borderRadius: radius, overflow: 'hidden' }]}
        >
          <NativeAdAdvert ad={ad} radius={radius} />
        </Animated.View>
      ) : null}
    </View>
  );
}

/** Renders a single native ad sized to fill the square artwork box. */
function NativeAdAdvert({ ad, radius }: { ad: NativeAd; radius: number }) {
  return (
    <NativeAdView nativeAd={ad} style={[StyleSheet.absoluteFill, { borderRadius: radius }]}>
      <View style={styles.adFill}>
        {/* Media (image/video) fills the box. */}
        <NativeMediaView style={styles.media} resizeMode="cover" />

        {/* Required "Ad" attribution badge. */}
        <View style={styles.adBadge}>
          <Text style={styles.adBadgeText}>Ad</Text>
        </View>

        {/* Bottom overlay with headline + call-to-action. */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.85)']}
          style={styles.bottomOverlay}
        >
          <View style={styles.bottomRow}>
            {ad.icon?.url ? (
              <NativeAsset assetType={NativeAssetType.ICON}>
                <Image source={{ uri: ad.icon.url }} style={styles.icon} contentFit="cover" />
              </NativeAsset>
            ) : null}
            <View style={styles.textCol}>
              <NativeAsset assetType={NativeAssetType.HEADLINE}>
                <Text style={styles.headline} numberOfLines={1}>
                  {ad.headline}
                </Text>
              </NativeAsset>
              {ad.advertiser || ad.body ? (
                <NativeAsset assetType={NativeAssetType.BODY}>
                  <Text style={styles.body} numberOfLines={1}>
                    {ad.advertiser || ad.body}
                  </Text>
                </NativeAsset>
              ) : null}
            </View>
          </View>
          {ad.callToAction ? (
            <NativeAsset assetType={NativeAssetType.CALL_TO_ACTION}>
              <Text style={styles.cta} numberOfLines={1}>
                {ad.callToAction}
              </Text>
            </NativeAsset>
          ) : null}
        </LinearGradient>
      </View>
    </NativeAdView>
  );
}

const styles = StyleSheet.create({
  box: { overflow: 'hidden', backgroundColor: '#1a1029' },
  adFill: { flex: 1, backgroundColor: '#120A2E' },
  media: { width: '100%', height: '100%' },

  adBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#FFCC00',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  adBadgeText: { color: '#000000', fontSize: 11, fontWeight: FontWeight.bold },

  bottomOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 12,
    paddingTop: 24,
    paddingBottom: 12,
    gap: 8,
  },
  bottomRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  icon: { width: 36, height: 36, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.1)' },
  textCol: { flex: 1 },
  headline: { color: Colors.text, fontSize: FontSize.md, fontWeight: FontWeight.bold },
  body: { color: Colors.textMuted, fontSize: FontSize.xs, marginTop: 2 },
  cta: {
    alignSelf: 'flex-start',
    color: '#0A0014',
    backgroundColor: Colors.accent,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    overflow: 'hidden',
  },
});
