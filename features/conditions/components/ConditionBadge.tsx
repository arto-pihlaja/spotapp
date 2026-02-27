import { StyleSheet, View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import type { ConditionReport } from '../types';
import { getCardinalLabel } from '../types';
import { getRecencyInfo } from '../utils/recency';
import { RecencyIndicator } from './RecencyIndicator';

interface ConditionBadgeProps {
  condition: ConditionReport;
  showReporter: boolean;
  onConfirm?: () => void;
  confirmDisabled?: boolean;
}

const DIRECTION_ARROWS: Record<string, string> = {
  N: '\u2191',   // ↑
  NE: '\u2197',  // ↗
  E: '\u2192',   // →
  SE: '\u2198',  // ↘
  S: '\u2193',   // ↓
  SW: '\u2199',  // ↙
  W: '\u2190',   // ←
  NW: '\u2196',  // ↖
};

function buildAccessibilityLabel(c: ConditionReport, showReporter: boolean): string {
  const parts: string[] = ['Conditions:'];
  if (c.waveHeight != null) {
    parts.push(`${c.waveHeight >= 2.5 ? '2 plus' : c.waveHeight.toFixed(1)} meter waves`);
  }
  if (c.windSpeed != null) {
    parts.push(`${c.windSpeed} meters per second wind`);
    if (c.windDirection != null) {
      parts.push(`from ${getCardinalLabel(c.windDirection).toLowerCase()}`);
    }
  }
  const { accessibilityLabel: timeLabel } = getRecencyInfo(c.createdAt);
  parts.push(timeLabel);
  if (showReporter && c.reporter) {
    parts.push(`by ${c.reporter.username}`);
  }
  if (c.confirmCount > 0) {
    parts.push(`${c.confirmCount} confirmation${c.confirmCount > 1 ? 's' : ''}`);
  }
  return parts.join(', ');
}

export function ConditionBadge({
  condition: c,
  showReporter,
  onConfirm,
  confirmDisabled,
}: ConditionBadgeProps) {
  const router = useRouter();
  const { color: recencyColor } = getRecencyInfo(c.createdAt);
  const cardinal = c.windDirection != null ? getCardinalLabel(c.windDirection) : null;
  const arrow = cardinal ? DIRECTION_ARROWS[cardinal] ?? '' : '';

  return (
    <View
      style={[styles.card, { borderLeftColor: recencyColor }]}
      accessibilityLabel={buildAccessibilityLabel(c, showReporter)}
      accessibilityRole="summary"
    >
      {/* Data row */}
      <View style={styles.dataRow}>
        {c.waveHeight != null && (
          <View style={styles.metric}>
            <Text style={styles.metricValue}>
              {c.waveHeight >= 2.5 ? '2+' : c.waveHeight.toFixed(1)}m
            </Text>
            <Text style={styles.metricLabel}>waves</Text>
          </View>
        )}

        {c.windSpeed != null && (
          <View style={styles.metric}>
            <Text style={styles.metricValue}>
              {c.windSpeed} m/s
            </Text>
            <Text style={styles.metricLabel}>
              {cardinal ? `${arrow} ${cardinal}` : 'wind'}
            </Text>
          </View>
        )}

        <View style={styles.recencyContainer}>
          <RecencyIndicator createdAt={c.createdAt} />
        </View>
      </View>

      {/* Meta row */}
      <View style={styles.metaRow}>
        <Text style={styles.metaText}>
          {showReporter && c.reporter ? (
            <Text
              style={styles.reporterLink}
              onPress={() => router.push(`/profile/${c.reporter!.id}`)}
            >
              {c.reporter.username}
            </Text>
          ) : 'Anonymous'}
          {c.confirmCount > 0
            ? ` \u00B7 ${c.confirmCount} confirm${c.confirmCount > 1 ? 's' : ''}`
            : ''}
        </Text>

        {onConfirm && (
          <Pressable
            style={[styles.confirmChip, confirmDisabled && styles.confirmChipDisabled]}
            disabled={confirmDisabled}
            onPress={onConfirm}
          >
            <Text
              style={[
                styles.confirmChipText,
                confirmDisabled && styles.confirmChipTextDisabled,
              ]}
            >
              {confirmDisabled ? 'Confirmed' : 'Confirm'}
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#9CA3AF',
    padding: 12,
    marginBottom: 8,
  },
  dataRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
  },
  metric: {
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
  },
  metricLabel: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  recencyContainer: {
    marginLeft: 'auto',
    paddingTop: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E2E8F0',
  },
  metaText: {
    fontSize: 12,
    color: '#64748B',
    flex: 1,
  },
  reporterLink: {
    color: '#0284C7',
  },
  confirmChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#E0F2FE',
  },
  confirmChipDisabled: {
    backgroundColor: '#F1F5F9',
  },
  confirmChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0284C7',
  },
  confirmChipTextDisabled: {
    color: '#94A3B8',
  },
});
