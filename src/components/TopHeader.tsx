import React from "react";
import { Pressable, StyleSheet, Text, View, ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, type Href } from "expo-router";
import * as Haptics from "expo-haptics";
import { Colors } from "@/constants/colors";
import { FontSize, FontWeight, HitSlop, Spacing } from "@/constants/theme";

type Props = {
  title?: string;
  subtitle?: string;
  /** Hide the search icon (e.g. inside Settings). */
  hideSearch?: boolean;
  /** Override the right-side menu icon's destination. */
  onMenu?: () => void;
  /** Show a back button instead of the menu button. */
  backTo?: string;
  style?: ViewStyle;
};

export function TopHeader({ title, subtitle, hideSearch, onMenu, backTo, style }: Props) {
  const handleSearch = () => {
    void Haptics.selectionAsync();
    router.push("/search");
  };
  const handleMenu = () => {
    void Haptics.selectionAsync();
    if (onMenu) return onMenu();
    // Runtime route is `/settings` (resolves to app/settings/index.tsx). The
    // typed-routes generator surfaces it as `/settings/index`, which doesn't
    // match at runtime, so we cast through Href to use the canonical URL.
    router.push("/settings" as Href);
  };
  const handleBack = () => {
    void Haptics.selectionAsync();
    if (backTo) router.replace(backTo as never);
    else if (router.canGoBack()) router.back();
  };

  return (
    <View style={[styles.row, style]}>
      {backTo !== undefined ? (
        <Pressable hitSlop={HitSlop} onPress={handleBack} style={styles.iconBtn}>
          <Ionicons name="chevron-back" size={22} color={Colors.text} />
        </Pressable>
      ) : null}
      <View style={styles.titleSlot}>
        {title ? (
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
        ) : null}
        {subtitle ? (
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {!hideSearch ? (
        <Pressable hitSlop={HitSlop} onPress={handleSearch} style={styles.iconBtn}>
          <Ionicons name="search" size={22} color={Colors.text} />
        </Pressable>
      ) : null}
      <Pressable hitSlop={HitSlop} onPress={handleMenu} style={styles.iconBtn}>
        <Ionicons name="settings-outline" size={22} color={Colors.text} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    gap: Spacing.xs,
  },
  titleSlot: { flex: 1, justifyContent: "center" },
  title: { color: Colors.text, fontSize: FontSize.xxl, fontWeight: FontWeight.bold },
  subtitle: { color: Colors.textMuted, fontSize: FontSize.sm, marginTop: 2 },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
    justifyContent: "center",
  },
});
