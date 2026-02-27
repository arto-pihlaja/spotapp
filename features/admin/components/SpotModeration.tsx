import { ActivityIndicator, Alert, FlatList, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useAdminSpots } from '../hooks/useSpots';
import { useDeleteSpot } from '../hooks/useDeleteSpot';
import { useRevertWiki } from '../hooks/useRevertWiki';
import type { SpotForModeration } from '../types';

function confirmAction(title: string, message: string, onConfirm: () => void) {
  if (Platform.OS === 'web') {
    if (window.confirm(`${title}\n\n${message}`)) {
      onConfirm();
    }
  } else {
    Alert.alert(title, message, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Confirm', style: 'destructive', onPress: onConfirm },
    ]);
  }
}

function SpotRow({ spot }: { spot: SpotForModeration }) {
  const deleteMutation = useDeleteSpot();
  const revertMutation = useRevertWiki();
  const isBusy = deleteMutation.isPending || revertMutation.isPending;

  const handleDelete = () => {
    confirmAction(
      `Delete "${spot.name}"?`,
      'This will permanently delete the spot and all associated sessions, conditions, and wiki content. This action cannot be undone.',
      () => deleteMutation.mutate(spot.id),
    );
  };

  const handleRevertWiki = () => {
    confirmAction(
      `Clear wiki for "${spot.name}"?`,
      'This will remove all wiki content for this spot.',
      () => revertMutation.mutate(spot.id),
    );
  };

  return (
    <View style={styles.row}>
      <View style={styles.spotInfo}>
        <Text style={styles.spotName}>{spot.name}</Text>
        <Text style={styles.creator}>by {spot.creator.username}</Text>
      </View>
      <Text style={styles.stats}>
        {spot.sessionCount} sessions, {spot.conditionReportCount} reports
        {spot.hasWiki ? ', has wiki' : ''}
      </Text>
      <View style={styles.actions}>
        {spot.hasWiki && (
          <Pressable
            style={[styles.button, styles.revertButton]}
            onPress={handleRevertWiki}
            disabled={isBusy}
          >
            {revertMutation.isPending ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonText}>Clear Wiki</Text>
            )}
          </Pressable>
        )}
        <Pressable
          style={[styles.button, styles.deleteButton]}
          onPress={handleDelete}
          disabled={isBusy}
        >
          {deleteMutation.isPending ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.buttonText}>Delete Spot</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

export default function SpotModeration() {
  const { data: spots, isLoading, error } = useAdminSpots();

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Failed to load spots</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={spots}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <SpotRow spot={item} />}
      contentContainerStyle={styles.list}
      ListEmptyComponent={
        <View style={styles.center}>
          <Text style={styles.emptyText}>No spots found</Text>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  list: {
    padding: 16,
  },
  row: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  spotInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  spotName: {
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
  creator: {
    fontSize: 13,
    color: '#6B7280',
  },
  stats: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 12,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  button: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    minWidth: 80,
    alignItems: 'center',
  },
  deleteButton: {
    backgroundColor: '#EF4444',
  },
  revertButton: {
    backgroundColor: '#F59E0B',
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 40,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 16,
  },
  emptyText: {
    color: '#6B7280',
    fontSize: 16,
  },
});
