import { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, Text, ActivityIndicator, Pressable } from 'react-native';
import { BottomSheet } from '@/components/BottomSheet';
import { useSpot } from '../hooks/useSpot';
import { WikiView } from '@/features/wiki/components/WikiView';
import { WikiEditor } from '@/features/wiki/components/WikiEditor';
import { useWiki } from '@/features/wiki/hooks/useWiki';
import { useSocketRoom } from '@/lib/useSocketRoom';
import { useSocketEvent } from '@/lib/useSocketEvent';
import { queryClient } from '@/lib/queryClient';
import { useConditions } from '@/features/conditions/hooks/useConditions';
import { QuickReportSlider } from '@/features/conditions/components/QuickReportSlider';
import { useConfirmCondition } from '@/features/conditions/hooks/useConfirmCondition';
import { getCardinalLabel } from '@/features/conditions/types';
import { useAuthStore } from '@/stores/useAuthStore';

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
  const { data: wiki } = useWiki(spotId);
  const { data: conditions } = useConditions(spotId);
  const confirmMutation = useConfirmCondition(spotId ?? '');
  const [editing, setEditing] = useState(false);
  const [reporting, setReporting] = useState(false);
  const isAuthenticated = useAuthStore((s) => !!s.accessToken);

  // Reset state when spot changes
  useEffect(() => {
    setEditing(false);
    setReporting(false);
  }, [spotId]);

  // Join/leave spot room for real-time updates
  useSocketRoom('spot', spotId);

  // Invalidate queries on real-time events
  const handleConditionNew = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['spot', spotId] });
    queryClient.invalidateQueries({ queryKey: ['spot', spotId, 'conditions'] });
  }, [spotId]);

  const handleConditionConfirmed = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['spot', spotId] });
    queryClient.invalidateQueries({ queryKey: ['spot', spotId, 'conditions'] });
  }, [spotId]);

  useSocketEvent('condition:new', handleConditionNew, !!spotId);
  useSocketEvent('condition:confirmed', handleConditionConfirmed, !!spotId);

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

          {/* Wiki */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About</Text>
            {editing && spotId ? (
              <WikiEditor
                spotId={spotId}
                initialContent={wiki?.content ?? ''}
                onDone={() => setEditing(false)}
              />
            ) : (
              <WikiView spotId={spotId} onEdit={() => setEditing(true)} />
            )}
          </View>

          {/* Conditions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Conditions</Text>
            {reporting && spotId ? (
              <QuickReportSlider
                spotId={spotId}
                onDone={() => setReporting(false)}
              />
            ) : (
              <>
                {conditions && conditions.length > 0 ? (
                  conditions.slice(0, 3).map((c) => (
                    <View key={c.id} style={styles.conditionCard}>
                      <View style={styles.conditionRow}>
                        {c.waveHeight != null && (
                          <Text style={styles.conditionValue}>
                            {c.waveHeight >= 2.5 ? '2+' : c.waveHeight.toFixed(1)}m waves
                          </Text>
                        )}
                        {c.windSpeed != null && (
                          <Text style={styles.conditionValue}>
                            {c.windSpeed} m/s{c.windDirection != null ? ` ${getCardinalLabel(c.windDirection)} ${c.windDirection}°` : ''}
                          </Text>
                        )}
                      </View>
                      <Text style={styles.conditionMeta}>
                        {formatRelativeDate(c.createdAt)}
                        {c.reporter ? ` by ${c.reporter.username}` : ''}
                        {c.confirmCount > 0 ? ` · ${c.confirmCount} confirm${c.confirmCount > 1 ? 's' : ''}` : ''}
                      </Text>
                      {isAuthenticated && (
                        <Pressable
                          style={[
                            styles.confirmButton,
                            c.hasConfirmed && styles.confirmButtonDisabled,
                          ]}
                          disabled={c.hasConfirmed}
                          onPress={() => confirmMutation.mutate(c.id)}
                        >
                          <Text
                            style={[
                              styles.confirmButtonText,
                              c.hasConfirmed && styles.confirmButtonTextDisabled,
                            ]}
                          >
                            {c.hasConfirmed ? 'Confirmed' : 'Confirm'}
                          </Text>
                        </Pressable>
                      )}
                    </View>
                  ))
                ) : (
                  <Text style={styles.placeholder}>No condition reports yet</Text>
                )}
                {isAuthenticated && (
                  <Pressable
                    style={styles.reportButton}
                    onPress={() => setReporting(true)}
                  >
                    <Text style={styles.reportButtonText}>Report Conditions</Text>
                  </Pressable>
                )}
              </>
            )}
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
  conditionCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
  },
  conditionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  conditionValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  conditionMeta: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  },
  confirmButton: {
    height: 48,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    backgroundColor: '#E0F2FE',
  },
  confirmButtonDisabled: {
    backgroundColor: '#F1F5F9',
  },
  confirmButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0284C7',
  },
  confirmButtonTextDisabled: {
    color: '#94A3B8',
  },
  reportButton: {
    backgroundColor: '#0284C7',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 4,
  },
  reportButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
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
