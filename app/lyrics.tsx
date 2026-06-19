import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GlassCard } from '@/components/GlassCard';
import { BackgroundGradient } from '@/components/BackgroundGradient';
import { selectCurrentSong, useMusicStore } from '@/store/musicStore';
import { useLyricsStore } from '@/store/lyricsStore';
import { fetchLyrics } from '@/services/LyricsService';
import { activeLineIndex, isSyncedLyrics, parseLyrics, toPlainText } from '@/utils/lrc';
import { Colors } from '@/constants/colors';
import { FontSize, FontWeight, HitSlop, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

type Mode = 'view' | 'edit';

export default function LyricsScreen() {
  const theme = useTheme();
  const current = useMusicStore(selectCurrentSong);
  const positionSeconds = useMusicStore((s) => s.positionSeconds);

  const saved = useLyricsStore((s) => (current ? s.byId[current.id] : undefined));
  const saveLyrics = useLyricsStore((s) => s.set);
  const clearLyrics = useLyricsStore((s) => s.clear);

  const [mode, setMode] = useState<Mode>('view');
  const [draft, setDraft] = useState('');
  const [searching, setSearching] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const scrollRef = useRef<ScrollView>(null);
  const lineOffsets = useRef<number[]>([]);

  const lines = useMemo(() => parseLyrics(saved ?? ''), [saved]);
  const synced = useMemo(() => isSyncedLyrics(saved ?? ''), [saved]);
  const activeIdx = useMemo(
    () => (synced ? activeLineIndex(lines, positionSeconds) : -1),
    [synced, lines, positionSeconds],
  );

  // Auto-scroll synced lyrics to keep the active line centered.
  useEffect(() => {
    if (mode !== 'view' || !synced || activeIdx < 0) return;
    const y = lineOffsets.current[activeIdx];
    if (y != null) {
      scrollRef.current?.scrollTo({ y: Math.max(0, y - 160), animated: true });
    }
  }, [activeIdx, synced, mode]);

  const onSearch = useCallback(async () => {
    if (!current) return;
    void Haptics.selectionAsync();
    setSearching(true);
    setStatus(null);
    const result = await fetchLyrics(
      current.artist,
      current.title,
      current.album,
      current.duration,
    );
    setSearching(false);
    if (!result) {
      setStatus('No lyrics found online. Try editing the song title/artist or add them manually.');
      return;
    }
    const text = result.synced ?? result.plain ?? '';
    setDraft(text);
    setMode('edit');
    setStatus(
      result.synced
        ? 'Found time-synced lyrics. Review and save.'
        : 'Found lyrics. Review and save.',
    );
  }, [current]);

  const onCopy = useCallback(async () => {
    if (!saved) return;
    void Haptics.selectionAsync();
    await Clipboard.setStringAsync(toPlainText(saved));
    setStatus('Lyrics copied to clipboard.');
  }, [saved]);

  const onPaste = useCallback(async () => {
    const text = await Clipboard.getStringAsync();
    if (text) setDraft((d) => (d ? `${d}\n${text}` : text));
  }, []);

  const onSave = useCallback(() => {
    if (!current) return;
    void Haptics.selectionAsync();
    const trimmed = draft.trim();
    if (trimmed) saveLyrics(current.id, trimmed);
    else clearLyrics(current.id);
    setMode('view');
    setStatus('Lyrics saved.');
  }, [current, draft, saveLyrics, clearLyrics]);

  const startEdit = useCallback(() => {
    void Haptics.selectionAsync();
    setDraft(saved ?? '');
    setMode('edit');
    setStatus(null);
  }, [saved]);

  const onClear = useCallback(() => {
    if (!current) return;
    void Haptics.selectionAsync();
    clearLyrics(current.id);
    setStatus('Lyrics removed.');
  }, [current, clearLyrics]);

  if (!current) {
    return (
      <BackgroundGradient>
        <SafeAreaView style={styles.center}>
          <Text style={styles.muted}>Nothing is playing.</Text>
          <Pressable onPress={() => router.back()} style={styles.outlineBtn}>
            <Text style={styles.outlineBtnText}>Close</Text>
          </Pressable>
        </SafeAreaView>
      </BackgroundGradient>
    );
  }

  return (
    <BackgroundGradient>
      <SafeAreaView style={styles.flex} edges={['top', 'left', 'right', 'bottom']}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.headerRow}>
            <Pressable hitSlop={HitSlop} onPress={() => router.back()} style={styles.iconBtn}>
              <Ionicons name="chevron-down" size={22} color={Colors.text} />
            </Pressable>
            <View style={{ flex: 1, alignItems: 'center' }}>
              <Text style={styles.headerEyebrow}>Lyrics</Text>
              <Text style={styles.headerTitle} numberOfLines={1}>
                {current.title}
              </Text>
            </View>
            <View style={styles.iconBtn} />
          </View>

          {mode === 'edit' ? (
            <View style={styles.flex}>
              <TextInput
                value={draft}
                onChangeText={setDraft}
                multiline
                placeholder={'Paste or type lyrics here.\nTip: lines like [00:12.50] sync to playback.'}
                placeholderTextColor={Colors.textFaint}
                style={styles.editor}
                textAlignVertical="top"
                autoFocus
              />
              {status ? <Text style={styles.status}>{status}</Text> : null}
              <View style={styles.editToolbar}>
                <ToolBtn icon="clipboard-outline" label="Paste" onPress={onPaste} />
                <ToolBtn
                  icon="close"
                  label="Cancel"
                  onPress={() => {
                    setMode('view');
                    setStatus(null);
                  }}
                />
                <ToolBtn icon="checkmark" label="Save" accent onPress={onSave} />
              </View>
            </View>
          ) : (
            <View style={styles.flex}>
              {lines.length === 0 ? (
                <View style={styles.empty}>
                  <Ionicons name="musical-note-outline" size={40} color={Colors.textFaint} />
                  <Text style={styles.emptyTitle}>No lyrics yet</Text>
                  <Text style={styles.emptyMsg}>
                    Search online for synced lyrics, or add your own.
                  </Text>
                  {status ? <Text style={styles.status}>{status}</Text> : null}
                  <View style={styles.emptyActions}>
                    <Pressable
                      onPress={onSearch}
                      style={[styles.primaryBtn, { backgroundColor: theme.accent }]}
                    >
                      {searching ? (
                        <ActivityIndicator color="#0A0014" />
                      ) : (
                        <>
                          <Ionicons name="search" size={18} color="#0A0014" />
                          <Text style={styles.primaryBtnText}>Browse online</Text>
                        </>
                      )}
                    </Pressable>
                    <Pressable onPress={startEdit} style={styles.outlineBtn}>
                      <Text style={styles.outlineBtnText}>Add manually</Text>
                    </Pressable>
                  </View>
                </View>
              ) : (
                <>
                  <ScrollView
                    ref={scrollRef}
                    style={styles.flex}
                    contentContainerStyle={styles.lyricsContent}
                    showsVerticalScrollIndicator={false}
                  >
                    {lines.map((line, i) => (
                      <Text
                        key={`${i}-${line.time ?? 'x'}`}
                        onLayout={(e) => {
                          lineOffsets.current[i] = e.nativeEvent.layout.y;
                        }}
                        style={[
                          styles.lyricLine,
                          synced && i !== activeIdx && styles.inactiveLine,
                          synced && i === activeIdx && styles.activeLine,
                          synced && i === activeIdx && { color: theme.accent },
                          line.text.length === 0 && styles.blankLine,
                        ]}
                      >
                        {line.text || ' '}
                      </Text>
                    ))}
                  </ScrollView>
                  {status ? <Text style={styles.status}>{status}</Text> : null}
                  <GlassCard radius={Radius.lg} variant="strong" style={styles.toolbar} noPadding>
                    <View style={styles.toolbarRow}>
                      <ToolBtn icon="search" label="Browse" onPress={onSearch} busy={searching} />
                      <ToolBtn icon="create-outline" label="Edit" onPress={startEdit} />
                      <ToolBtn icon="copy-outline" label="Copy" onPress={onCopy} />
                      <ToolBtn icon="trash-outline" label="Clear" onPress={onClear} />
                    </View>
                  </GlassCard>
                </>
              )}
            </View>
          )}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </BackgroundGradient>
  );
}

function ToolBtn({
  icon,
  label,
  onPress,
  accent,
  busy,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  accent?: boolean;
  busy?: boolean;
}) {
  return (
    <Pressable onPress={onPress} style={styles.toolBtn} hitSlop={6}>
      {busy ? (
        <ActivityIndicator color={Colors.text} />
      ) : (
        <Ionicons name={icon} size={22} color={accent ? Colors.success : Colors.text} />
      )}
      <Text style={[styles.toolLabel, accent && { color: Colors.success }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  muted: { color: Colors.textMuted },

  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  headerEyebrow: { color: Colors.textFaint, fontSize: FontSize.xs, letterSpacing: 1 },
  headerTitle: {
    color: Colors.text,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    maxWidth: 220,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  lyricsContent: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: 120,
    gap: 10,
  },
  lyricLine: {
    color: Colors.text,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    lineHeight: 26,
  },
  inactiveLine: { color: 'rgba(255,255,255,0.4)' },
  activeLine: { fontSize: 20, fontWeight: FontWeight.bold },
  blankLine: { height: 8 },

  toolbar: {
    position: 'absolute',
    left: Spacing.lg,
    right: Spacing.lg,
    bottom: Spacing.md,
    overflow: 'hidden',
  },
  toolbarRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: Spacing.md,
  },
  toolBtn: { alignItems: 'center', justifyContent: 'center', gap: 4, minWidth: 56 },
  toolLabel: { color: Colors.text, fontSize: FontSize.xs },

  editor: {
    flex: 1,
    color: Colors.text,
    fontSize: FontSize.md,
    lineHeight: 24,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
  },
  editToolbar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    borderTopColor: Colors.glassBorder,
    borderTopWidth: StyleSheet.hairlineWidth,
  },

  status: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    textAlign: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm,
  },

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, padding: Spacing.xl },
  emptyTitle: { color: Colors.text, fontSize: FontSize.lg, fontWeight: FontWeight.bold },
  emptyMsg: { color: Colors.textMuted, fontSize: FontSize.sm, textAlign: 'center' },
  emptyActions: { marginTop: Spacing.md, gap: Spacing.md, alignItems: 'center' },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: Spacing.xl,
    paddingVertical: 12,
    borderRadius: Radius.pill,
    minWidth: 180,
    justifyContent: 'center',
  },
  primaryBtnText: { color: '#0A0014', fontWeight: FontWeight.bold, fontSize: FontSize.md },
  outlineBtn: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: 10,
    borderRadius: Radius.pill,
    borderColor: Colors.glassBorder,
    borderWidth: StyleSheet.hairlineWidth,
  },
  outlineBtnText: { color: Colors.text, fontWeight: FontWeight.semibold },
});
