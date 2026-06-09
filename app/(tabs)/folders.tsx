import React from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { EmptyState } from '@/components/EmptyState';
import { FolderCard } from '@/components/FolderCard';
import { useMusicStore } from '@/store/musicStore';
import { MINI_PLAYER_HEIGHT } from '@/constants/theme';

export default function FoldersScreen() {
  const folders = useMusicStore((s) => s.folders);

  if (folders.length === 0) {
    return (
      <EmptyState
        icon="folder-outline"
        title="No folders found"
        message="Folders will appear here once your library has been scanned."
      />
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={folders}
        keyExtractor={(f) => f.path || f.name}
        renderItem={({ item }) => (
          <FolderCard
            folder={item}
            onPress={() =>
              router.push({
                pathname: '/folder/[id]',
                params: { id: encodeURIComponent(item.path || item.name), name: item.name },
              } as never)
            }
          />
        )}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  listContent: { paddingBottom: MINI_PLAYER_HEIGHT + 80, paddingTop: 4 },
});
