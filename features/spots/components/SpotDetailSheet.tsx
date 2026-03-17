import { useState, useEffect, useCallback, useRef } from 'react';
import { StyleSheet, View, Text, ActivityIndicator, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { BottomSheet, BottomSheetRef } from '@/components/BottomSheet';
import { useSpot } from '../hooks/useSpot';
import { WikiView } from '@/features/wiki/components/WikiView';
import { WikiEditor } from '@/features/wiki/components/WikiEditor';
import { useWiki } from '@/features/wiki/hooks/useWiki';
import { useSocketRoom } from '@/lib/useSocketRoom';
import { useSocketEvent } from '@/lib/useSocketEvent';
import { queryClient } from '@/lib/queryClient';
import { useConditions } from '@/features/conditions/hooks/useConditions';
import { QuickReportSlider } from '@/features/conditions/components/QuickReportSlider';
import { ConditionBadge } from '@/features/conditions/components/ConditionBadge';
import { useConfirmCondition } from '@/features/conditions/hooks/useConfirmCondition';
import { useAuthStore } from '@/stores/useAuthStore';
import { useSessions } from '@/features/sessions/hooks/useSessions';
import { useLeaveSession } from '@/features/sessions/hooks/useLeaveSession';
import { SessionForm } from '@/features/sessions/components/SessionForm';
import { SessionCard } from '@/features/sessions/components/SessionCard';

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
  const router = useRouter();
  const { data: spot, isLoading, error, refetch } = useSpot(spotId);
  const { data: wiki } = useWiki(spotId);
  const { data: conditions } = useConditions(spotId);
  const confirmMutation = useConfirmCondition(spotId ?? '');
  const { data: sessionsData, isLoading: sessionsLoading } = useSessions(spotId);
  const sessions = sessionsData?.sessions;
  const sessionCount = sessionsData?.sessionCount ?? 0;
  const hasOwnSession = sessions?.some((s) => s.isOwn);
  const leaveMutation = useLeaveSession(spotId ?? '');
  const [editing, setEditing] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [creatingSession, setCreatingSession] = useState(false);
  const [compassTouching, setCompassTouching] = useState(false);
  const isAuthenticated = useAuthStore((s) => !!s.accessToken);
  const sheetRef = useRef<BottomSheetRef>(null);

  // Reset state when spot changes
  useEffect(() => {
    setEditing(false);
    setReporting(false);
    setCreatingSession(false);
  }, [spotId]);

  // Expand sheet when reporting or editing wiki, snap back when done
  useEffect(() => {
    if (reporting || editing) {
      sheetRef.current?.animateTo(2);
    } else {
      sheetRef.current?.animateTo(1);
    }
  }, [reporting, editing]);

  // Exit reporting if user drags sheet below 90%
  const handleSnapChange = useCallback((snapIndex: number) => {
    if (snapIndex < 2 && reporting) {
      setReporting(false);
    }
  }, [reporting]);

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

  const handleSessionUpdate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['spot', spotId, 'sessions'] });
  }, [spotId]);

  useSocketEvent('condition:new', handleConditionNew, !!spotId);
  useSocketEvent('condition:confirmed', handleConditionConfirmed, !!spotId);
  useSocketEvent('session:joined', handleSessionUpdate, !!spotId);
  useSocketEvent('session:left', handleSessionUpdate, !!spotId);
  useSocketEvent('session:expired', handleSessionUpdate, !!spotId);

  return (
    <BottomSheet ref={sheetRef} visible={!!spotId} onDismiss={onDismiss} scrollEnabled={!compassTouching} onSnapChange={handleSnapChange}>
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

          {/* Sessions */}
          {!editing && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Sessions</Text>
              {creatingSession && spotId ? (
                <SessionForm
                  spotId={spotId}
                  onDone={() => setCreatingSession(false)}
                />
              ) : (
                <>
                  {sessionsLoading ? (
                    <ActivityIndicator size="small" color="#10B981" />
                  ) : !isAuthenticated && sessionCount > 0 ? (
                    <Text style={styles.sessionCount}>
                      {sessionCount} active {sessionCount === 1 ? 'session' : 'sessions'}
                    </Text>
                  ) : sessions && sessions.length > 0 ? (
                    sessions.map((s) => (
                      <SessionCard
                        key={s.id}
                        session={s}
                        onLeave={s.isOwn ? () => leaveMutation.mutate(s.id) : undefined}
                        leaveLoading={leaveMutation.isPending}
                      />
                    ))
                  ) : (
                    <Text style={styles.placeholder}>No active sessions</Text>
                  )}
                  {isAuthenticated && !hasOwnSession && (
                    <Pressable
                      style={styles.goingButton}
                      onPress={() => setCreatingSession(true)}
                    >
                      <Text style={styles.goingButtonText}>I'm Going</Text>
                    </Pressable>
                  )}
                </>
              )}
            </View>
          )}

          {/* Conditions */}
          {!editing && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Conditions</Text>
              {reporting && spotId ? (
                <QuickReportSlider
                  spotId={spotId}
                  onDone={() => setReporting(false)}
                  onCompassTouchChange={setCompassTouching}
                />
              ) : (
                <>
                  {conditions && conditions.length > 0 ? (
                    conditions.slice(0, 3).map((c) => (
                      <ConditionBadge
                        key={c.id}
                        condition={c}
                        showReporter={isAuthenticated}
                        onConfirm={isAuthenticated ? () => confirmMutation.mutate(c.id) : undefined}
                        confirmDisabled={c.hasConfirmed}
                      />
                    ))
                  ) : (
                    <Text style={styles.placeholder}>No condition reports yet</Text>
                  )}
                  {isAuthenticated && (
                    <Pressable
                      style={styles.reportButton}
                      onPress={() => setReporting(true)}
                    >
                      <Text style={styles.reportButtonText}>Conditions Changed</Text>
                    </Pressable>
                  )}
                </>
              )}
            </View>
          )}

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

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              {spot.creator ? (
                <>
                  Added by{' '}
                  <Text
                    style={styles.creatorLink}
                    onPress={() => router.push(`/profile/${spot.creator!.id}`)}
                  >
                    {spot.creator.username}
                  </Text>
                  {' '}{formatRelativeDate(spot.createdAt)}
                </>
              ) : (
                `Added ${formatRelativeDate(spot.createdAt)}`
              )}
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
  placeholder: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
  },
  reportButton: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: '#0284C7',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 4,
  },
  reportButtonText: {
    color: '#0284C7',
    fontSize: 14,
    fontWeight: '600',
  },
  goingButton: {
    backgroundColor: '#10B981',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 4,
  },
  goingButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  sessionCount: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '600',
    marginBottom: 4,
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
  creatorLink: {
    color: '#0284C7',
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
