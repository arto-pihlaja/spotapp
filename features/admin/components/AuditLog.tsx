import { useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useAuditLogs } from '../hooks/useAuditLogs';
import type { AuditAction, AuditLogEntry } from '../types';

const ACTION_LABELS: Record<AuditAction, { label: string; icon: string; color: string }> = {
  USER_BLOCKED: { label: 'User Blocked', icon: '\u{1F6AB}', color: '#EF4444' },
  USER_UNBLOCKED: { label: 'User Unblocked', icon: '\u{2705}', color: '#10B981' },
  SPOT_DELETED: { label: 'Spot Deleted', icon: '\u{1F5D1}', color: '#F97316' },
  WIKI_REVERTED: { label: 'Wiki Reverted', icon: '\u{1F4DD}', color: '#8B5CF6' },
};

const FILTER_OPTIONS: { label: string; value: AuditAction | undefined }[] = [
  { label: 'All', value: undefined },
  { label: 'Blocked', value: 'USER_BLOCKED' },
  { label: 'Unblocked', value: 'USER_UNBLOCKED' },
  { label: 'Spot Del.', value: 'SPOT_DELETED' },
  { label: 'Wiki Rev.', value: 'WIKI_REVERTED' },
];

function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getTargetLabel(entry: AuditLogEntry): string {
  const meta = entry.metadata as Record<string, unknown> | null;
  if (entry.action === 'SPOT_DELETED' && meta?.spotName) {
    return `"${meta.spotName}"`;
  }
  return `${entry.targetType.toLowerCase()} ${entry.targetId.slice(0, 8)}...`;
}

function AuditLogRow({ entry }: { entry: AuditLogEntry }) {
  const config = ACTION_LABELS[entry.action];

  return (
    <View style={styles.row}>
      <View style={styles.rowHeader}>
        <View style={[styles.actionBadge, { backgroundColor: config.color + '1A' }]}>
          <Text style={styles.actionIcon}>{config.icon}</Text>
          <Text style={[styles.actionLabel, { color: config.color }]}>{config.label}</Text>
        </View>
        <Text style={styles.timeAgo}>{formatTimeAgo(entry.createdAt)}</Text>
      </View>
      <View style={styles.details}>
        <Text style={styles.detailText}>
          <Text style={styles.detailLabel}>Target: </Text>
          {getTargetLabel(entry)}
        </Text>
        <Text style={styles.detailText}>
          <Text style={styles.detailLabel}>By: </Text>
          {entry.adminUsername}
        </Text>
        <Text style={styles.timestamp}>{formatDate(entry.createdAt)}</Text>
      </View>
    </View>
  );
}

export default function AuditLog() {
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState<AuditAction | undefined>(undefined);
  const { data, isLoading, error } = useAuditLogs({ page, action: actionFilter });

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
        <Text style={styles.errorText}>Failed to load audit logs</Text>
      </View>
    );
  }

  const meta = data?.meta;

  return (
    <View style={styles.container}>
      <View style={styles.filters}>
        {FILTER_OPTIONS.map((opt) => (
          <Pressable
            key={opt.label}
            style={[styles.filterChip, actionFilter === opt.value && styles.filterChipActive]}
            onPress={() => { setActionFilter(opt.value); setPage(1); }}
          >
            <Text style={[styles.filterText, actionFilter === opt.value && styles.filterTextActive]}>
              {opt.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <FlatList
        data={data?.logs}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <AuditLogRow entry={item} />}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.center}>
            <Text style={styles.emptyText}>No audit log entries</Text>
          </View>
        }
      />

      {meta && meta.totalPages > 1 && (
        <View style={styles.pagination}>
          <Pressable
            style={[styles.pageButton, page <= 1 && styles.pageButtonDisabled]}
            onPress={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
          >
            <Text style={styles.pageButtonText}>Previous</Text>
          </Pressable>
          <Text style={styles.pageInfo}>
            {page} / {meta.totalPages}
          </Text>
          <Pressable
            style={[styles.pageButton, page >= meta.totalPages && styles.pageButtonDisabled]}
            onPress={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
            disabled={page >= meta.totalPages}
          >
            <Text style={styles.pageButtonText}>Next</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  filters: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 6,
    flexWrap: 'wrap',
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#E5E7EB',
  },
  filterChipActive: {
    backgroundColor: '#0284C7',
  },
  filterText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#4B5563',
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  list: {
    padding: 16,
    paddingTop: 8,
  },
  row: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  rowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 6,
  },
  actionIcon: {
    fontSize: 14,
  },
  actionLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  timeAgo: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  details: {
    gap: 2,
  },
  detailText: {
    fontSize: 13,
    color: '#374151',
  },
  detailLabel: {
    fontWeight: '600',
    color: '#6B7280',
  },
  timestamp: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 16,
  },
  pageButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#0284C7',
  },
  pageButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  pageButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  pageInfo: {
    fontSize: 14,
    color: '#4B5563',
    fontWeight: '500',
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
