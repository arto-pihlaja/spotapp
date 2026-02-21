import { StyleSheet, View, Text, ActivityIndicator, Pressable } from 'react-native';
import { BottomSheet } from '@/components/BottomSheet';
import { useSpot } from '../hooks/useSpot';

interface SpotDetailSheetProps {
  spotId: string | null;
  onDismiss: () => void;
}

function formatRelativeDate(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86_400_000);
  if (days < 1) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  if (months === 1) return '1 month ago';
  return `${months} months ago`;
}

export function SpotDetailSheet({ spotId, onDismiss }: SpotDetailSheetProps) {
  const { data: spot, isLoading, error, refetch } = useSpot(spotId);

  return (
    <BottomSheet visible={!!spotId} onDismiss={onDismiss}>
      {isLoading && (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      )}

      {error && (
        <View style={styles.centered}>
          <Text style={styles.errorText}>Failed to load spot details</Text>
          <Pressable onPress={() => refetch()} style={styles.retryButton}>
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      )}

      {spot && (
        <View>
          {/* Header */}
          <Text style={styles.name}>{spot.name}</Text>
          <Text style={styles.coords}>
            {spot.latitude.toFixed(5)}, {spot.longitude.toFixed(5)}
          </Text>

          {/* Wiki preview */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About</Text>
            <Text style={styles.sectionContent}>
              {spot.wikiContent?.content
                ? spot.wikiContent.content.length > 150
                  ? spot.wikiContent.content.slice(0, 150) + '...'
                  : spot.wikiContent.content
                : 'No description yet'}
            </Text>
          </View>

          {/* Conditions placeholder */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Conditions</Text>
            <Text style={styles.placeholder}>No condition reports yet</Text>
          </View>

          {/* Sessions placeholder */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Sessions</Text>
            <Text style={styles.placeholder}>No active sessions</Text>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Added by {spot.creator.username} {formatRelativeDate(spot.createdAt)}
            </Text>
          </View>
        </View>
      )}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  name: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  coords: {
    fontSize: 13,
    color: '#888',
    marginBottom: 20,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  sectionContent: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
  },
  placeholder: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
  },
  footer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#e0e0e0',
    paddingTop: 16,
    marginTop: 8,
  },
  footerText: {
    fontSize: 12,
    color: '#999',
  },
  errorText: {
    fontSize: 15,
    color: '#d32f2f',
    marginBottom: 12,
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: '#007AFF',
    borderRadius: 8,
  },
  retryText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
