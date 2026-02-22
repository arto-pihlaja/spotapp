import { useState, useEffect } from 'react';
import { StyleSheet, View, Text, Pressable } from 'react-native';
import type { Session } from '../types';
import { SPORT_EMOJI } from '../types';

interface SessionCardProps {
  session: Session;
  onLeave?: () => void;
  leaveLoading?: boolean;
}

const SPORT_LABELS: Record<string, string> = {
  WING_FOIL: 'Wing Foil',
  WINDSURF: 'Windsurf',
  KITE: 'Kite',
  OTHER: 'Other',
};

function formatSessionTime(scheduledAt: string, type: string): string {
  const date = new Date(scheduledAt);
  const now = new Date();
  if (type === 'NOW') {
    return 'Now';
  }
  const diffMs = date.getTime() - now.getTime();
  const diffMin = Math.round(diffMs / 60_000);
  if (diffMin <= 0) return 'Now';
  if (diffMin < 60) return `in ${diffMin}m`;
  const hours = Math.floor(diffMin / 60);
  const mins = diffMin % 60;
  if (mins === 0) return `in ${hours}h`;
  return `in ${hours}h ${mins}m`;
}

function formatCountdown(expiresAt: string): string {
  const remaining = new Date(expiresAt).getTime() - Date.now();
  if (remaining <= 0) return 'expiring...';
  const mins = Math.ceil(remaining / 60_000);
  if (mins < 60) return `${mins}m left`;
  const hours = Math.floor(mins / 60);
  const m = mins % 60;
  if (m === 0) return `${hours}h left`;
  return `${hours}h ${m}m left`;
}

function useCountdown(expiresAt: string | null): string | null {
  const [text, setText] = useState<string | null>(
    expiresAt ? formatCountdown(expiresAt) : null,
  );

  useEffect(() => {
    if (!expiresAt) {
      setText(null);
      return;
    }
    setText(formatCountdown(expiresAt));
    const id = setInterval(() => {
      setText(formatCountdown(expiresAt));
    }, 60_000);
    return () => clearInterval(id);
  }, [expiresAt]);

  return text;
}

export function SessionCard({ session, onLeave, leaveLoading }: SessionCardProps) {
  const typeLabel = session.type === 'NOW' ? 'Going' : 'Planned';
  const typeColor = session.type === 'NOW' ? '#10B981' : '#0284C7';
  const countdown = useCountdown(session.type === 'NOW' ? session.expiresAt : null);

  return (
    <View style={styles.card} accessibilityLabel={`${session.user.username} ${typeLabel} for ${SPORT_LABELS[session.sportType]}`}>
      <View style={[styles.typeBadge, { backgroundColor: typeColor }]}>
        <Text style={styles.typeBadgeText}>{typeLabel}</Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.username}>{session.user.username}</Text>
        <Text style={styles.details}>
          {SPORT_EMOJI[session.sportType] ?? ''} {SPORT_LABELS[session.sportType] ?? session.sportType} · {formatSessionTime(session.scheduledAt, session.type)}
          {countdown ? ` · ${countdown}` : ''}
        </Text>
      </View>
      {session.isOwn && onLeave && (
        <Pressable
          style={styles.leaveButton}
          onPress={onLeave}
          disabled={leaveLoading}
        >
          <Text style={styles.leaveText}>{leaveLoading ? '...' : 'Leave'}</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: '#fafafa',
    borderRadius: 8,
    marginBottom: 6,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#e8e8e8',
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    marginRight: 10,
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
  },
  info: {
    flex: 1,
  },
  username: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  details: {
    fontSize: 12,
    color: '#777',
    marginTop: 1,
  },
  leaveButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#fee2e2',
  },
  leaveText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#dc2626',
  },
});
