import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Alert, Platform, ToastAndroid, View, StyleSheet, Text, ActivityIndicator } from 'react-native';
import { AdsConsent, AdsConsentStatus } from 'react-native-google-mobile-ads';
import { StorageService } from '@/services/StorageService';
import { StorageKeys } from '@/constants/audio';
import { Colors } from '@/constants/colors';
import { FontSize, FontWeight } from '@/constants/theme';

// Context types
interface AdConsentContextType {
  canRequestAds: boolean;
  consentStatus: AdsConsentStatus;
  isLoading: boolean;
  showPrivacyOptionsForm: () => Promise<void>;
}

interface AdConsentState {
  canRequestAds: boolean;
  consentStatus: AdsConsentStatus;
  isLoading: boolean;
}

// Create context
const AdConsentContext = createContext<AdConsentContextType | null>(null);

interface AdConsentProviderProps {
  children: ReactNode;
}

/**
 * Provider that handles Google User Messaging Platform (UMP) SDK for GDPR consent.
 * 
 * Key behaviors:
 * - Only runs consent check on first app launch (tracked via AsyncStorage)
 * - Blocks app rendering with loading screen until consent flow completes
 * - On errors: shows alert/toast and continues normally (non-blocking)
 * - After consent form interaction: updates ads service accordingly
 * - Provides privacy options form for settings screen
 */
export function AdConsentProvider({ children }: AdConsentProviderProps) {
  const [state, setState] = useState<AdConsentState>({
    canRequestAds: false,
    consentStatus: AdsConsentStatus.UNKNOWN,
    isLoading: true,
  });

  useEffect(() => {
    initializeConsent();
  }, []);

  const initializeConsent = async () => {
    try {
      // Check if consent was already checked before
      const hasCheckedBefore = await StorageService.get(StorageKeys.consentChecked, false);
      
      if (hasCheckedBefore) {
        // Skip UMP check on subsequent launches, just get stored consent info
        const consentInfo = await AdsConsent.getConsentInfo();
        setState({
          canRequestAds: consentInfo.canRequestAds,
          consentStatus: consentInfo.status,
          isLoading: false,
        });
        return;
      }

      // First launch: run full UMP consent flow
      console.log('[AdConsent] First launch detected, checking consent requirements...');
      
      // Step 1: Request consent information update
      const consentInfo = await AdsConsent.requestInfoUpdate();
      console.log('[AdConsent] Consent info:', consentInfo);

      // Step 2: Show consent form if required and available
      if (consentInfo.isConsentFormAvailable && consentInfo.status === AdsConsentStatus.REQUIRED) {
        console.log('[AdConsent] Showing consent form...');
        await AdsConsent.loadAndShowConsentFormIfRequired();
        console.log('[AdConsent] Consent form dismissed');
      }

      // Step 3: Get final consent status
      const finalConsentInfo = await AdsConsent.getConsentInfo();
      console.log('[AdConsent] Final consent status:', finalConsentInfo);

      // Mark consent as checked so we don't run this flow again
      await StorageService.set(StorageKeys.consentChecked, true);

      setState({
        canRequestAds: finalConsentInfo.canRequestAds,
        consentStatus: finalConsentInfo.status,
        isLoading: false,
      });

      // Show confirmation if consent was obtained
      if (finalConsentInfo.status === AdsConsentStatus.OBTAINED) {
        showMessage('Privacy preferences saved');
      }

    } catch (error) {
      console.warn('[AdConsent] Consent initialization failed:', error);
      
      // Show non-blocking error message
      const errorMessage = error instanceof Error ? error.message : 'Consent check failed';
      showErrorAlert('Privacy Notice', `Could not load privacy preferences: ${errorMessage}. The app will continue normally.`);

      // Continue with default state (ads disabled)
      setState({
        canRequestAds: false,
        consentStatus: AdsConsentStatus.UNKNOWN,
        isLoading: false,
      });

      // Still mark as checked to prevent retry loops
      await StorageService.set(StorageKeys.consentChecked, true);
    }
  };

  const showPrivacyOptionsForm = async (): Promise<void> => {
    try {
      console.log('[AdConsent] Showing privacy options form...');
      await AdsConsent.showPrivacyOptionsForm();
      console.log('[AdConsent] Privacy options form dismissed');
      
      // Update consent status after form interaction
      const updatedConsentInfo = await AdsConsent.getConsentInfo();
      setState(prevState => ({
        ...prevState,
        canRequestAds: updatedConsentInfo.canRequestAds,
        consentStatus: updatedConsentInfo.status,
      }));

      showMessage('Privacy preferences updated');

    } catch (error) {
      console.warn('[AdConsent] Privacy options form failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      if (errorMessage.toLowerCase().includes('not available')) {
        showMessage('Privacy options not available in your region');
      } else {
        showErrorAlert('Privacy Options', `Could not show privacy options: ${errorMessage}`);
      }
    }
  };

  const showMessage = (message: string) => {
    if (Platform.OS === 'android') {
      ToastAndroid.show(message, ToastAndroid.SHORT);
    } else {
      // For iOS, could use a simple alert or implement a custom toast
      console.log('[AdConsent]', message);
    }
  };

  const showErrorAlert = (title: string, message: string) => {
    Alert.alert(title, message, [{ text: 'OK' }]);
  };

  const contextValue: AdConsentContextType = {
    canRequestAds: state.canRequestAds,
    consentStatus: state.consentStatus,
    isLoading: state.isLoading,
    showPrivacyOptionsForm,
  };

  // Show loading screen while consent is being processed
  if (state.isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.text} />
        <Text style={styles.loadingText}>Loading privacy preferences...</Text>
      </View>
    );
  }

  return (
    <AdConsentContext.Provider value={contextValue}>
      {children}
    </AdConsentContext.Provider>
  );
}

/**
 * Hook to access consent context. Throws if used outside provider.
 */
export function useAdConsent(): AdConsentContextType {
  const context = useContext(AdConsentContext);
  if (!context) {
    throw new Error('useAdConsent must be used within AdConsentProvider');
  }
  return context;
}

/**
 * Standalone function to show privacy options form.
 * Can be used directly from components without accessing the full context.
 */
export async function showPrivacyOptionsForm(): Promise<void> {
  try {
    await AdsConsent.showPrivacyOptionsForm();
    // Show success message
    if (Platform.OS === 'android') {
      ToastAndroid.show('Privacy preferences updated', ToastAndroid.SHORT);
    }
  } catch (error) {
    console.warn('[AdConsent] Privacy options form failed:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    if (errorMessage.toLowerCase().includes('not available')) {
      if (Platform.OS === 'android') {
        ToastAndroid.show('Privacy options not available in your region', ToastAndroid.SHORT);
      }
    } else {
      Alert.alert('Privacy Options', `Could not show privacy options: ${errorMessage}`, [{ text: 'OK' }]);
    }
  }
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  loadingText: {
    color: Colors.text,
    fontSize: FontSize.md,
    fontWeight: FontWeight.medium,
  },
});