import { useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useUsers } from '../hooks/useUsers';
import { useBlockUser } from '../hooks/useBlockUser';
import { useUnblockUser } from '../hooks/useUnblockUser';
import type { UserForModeration } from '../types';

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

function UserRow({ user }: { user: UserForModeration }) {
  const blockMutation = useBlockUser();
  const unblockMutation = useUnblockUser();
  const isBusy = blockMutation.isPending || unblockMutation.isPending;

  const handleBlock = () => {
    confirmAction(
      `Block ${user.username}?`,
      'This will remove their sessions and condition reports.',
      () => blockMutation.mutate(user.id),
    );
  };

  const handleUnblock = () => {
    unblockMutation.mutate(user.id);
  };

  return (
    <View style={styles.row}>
      <View style={styles.userInfo}>
        <Text style={styles.username}>{user.username}</Text>
        <View style={[styles.badge, user.isBlocked ? styles.badgeBlocked : styles.badgeActive]}>
          <Text style={styles.badgeText}>{user.isBlocked ? 'Blocked' : 'Active'}</Text>
        </View>
      </View>
      <Text style={styles.stats}>
        {user.stats.sessionCount} sessions, {user.stats.conditionReportCount} reports
      </Text>
      <Pressable
        style={[styles.button, user.isBlocked ? styles.unblockButton : styles.blockButton]}
        onPress={user.isBlocked ? handleUnblock : handleBlock}
        disabled={isBusy}
      >
        {isBusy ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <Text style={styles.buttonText}>{user.isBlocked ? 'Unblock' : 'Block'}</Text>
        )}
      </Pressable>
    </View>
  );
}

export default function UserManagement() {
  const { data: users, isLoading, error } = useUsers();

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
        <Text style={styles.errorText}>Failed to load users</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={users}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <UserRow user={item} />}
      contentContainerStyle={styles.list}
      ListEmptyComponent={
        <View style={styles.center}>
          <Text style={styles.emptyText}>No users found</Text>
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
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  badgeActive: {
    backgroundColor: '#DCFCE7',
  },
  badgeBlocked: {
    backgroundColor: '#FEE2E2',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  stats: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 12,
  },
  button: {
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    minWidth: 80,
    alignItems: 'center',
  },
  blockButton: {
    backgroundColor: '#EF4444',
  },
  unblockButton: {
    backgroundColor: '#3B82F6',
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
