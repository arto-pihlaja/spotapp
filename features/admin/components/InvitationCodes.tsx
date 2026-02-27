import { useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useInvitationCodes } from '../hooks/useInvitationCodes';
import { useCreateInvitationCode } from '../hooks/useCreateInvitationCode';
import type { InvitationCode } from '../types';

function getStatusInfo(code: InvitationCode): { label: string; bg: string } {
  if (code.expiresAt && new Date(code.expiresAt) < new Date()) {
    return { label: 'Expired', bg: '#FEE2E2' };
  }
  if (code.currentUses >= code.maxUses) {
    return { label: 'Exhausted', bg: '#FEF3C7' };
  }
  return { label: 'Active', bg: '#DCFCE7' };
}

function CreateCodeForm() {
  const [maxUses, setMaxUses] = useState('10');
  const [expiresAt, setExpiresAt] = useState('');
  const mutation = useCreateInvitationCode();

  const handleCreate = () => {
    const parsed = parseInt(maxUses, 10);
    if (!parsed || parsed < 1) return;
    mutation.mutate({
      maxUses: parsed,
      ...(expiresAt ? { expiresAt } : {}),
    });
    setMaxUses('10');
    setExpiresAt('');
  };

  return (
    <View style={styles.formCard}>
      <Text style={styles.formTitle}>Generate Invitation Code</Text>
      <View style={styles.formRow}>
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Max Uses</Text>
          <TextInput
            style={styles.input}
            value={maxUses}
            onChangeText={setMaxUses}
            keyboardType="numeric"
            placeholder="10"
          />
        </View>
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Expires (optional)</Text>
          <TextInput
            style={styles.input}
            value={expiresAt}
            onChangeText={setExpiresAt}
            placeholder="YYYY-MM-DD"
          />
        </View>
      </View>
      <Pressable
        style={[styles.createButton, mutation.isPending && styles.createButtonDisabled]}
        onPress={handleCreate}
        disabled={mutation.isPending}
      >
        {mutation.isPending ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <Text style={styles.createButtonText}>Generate Code</Text>
        )}
      </Pressable>
    </View>
  );
}

function CodeRow({ code }: { code: InvitationCode }) {
  const status = getStatusInfo(code);

  return (
    <View style={styles.row}>
      <View style={styles.codeHeader}>
        <Text style={styles.codeValue}>{code.code}</Text>
        <View style={[styles.badge, { backgroundColor: status.bg }]}>
          <Text style={styles.badgeText}>{status.label}</Text>
        </View>
      </View>
      <Text style={styles.codeMeta}>
        Usage: {code.currentUses}/{code.maxUses} · Created by {code.creator.username}
      </Text>
      {code.expiresAt && (
        <Text style={styles.codeMeta}>
          Expires: {new Date(code.expiresAt).toLocaleDateString()}
        </Text>
      )}
    </View>
  );
}

export default function InvitationCodes() {
  const { data: codes, isLoading, error } = useInvitationCodes();

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
        <Text style={styles.errorText}>Failed to load invitation codes</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={codes}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <CodeRow code={item} />}
      contentContainerStyle={styles.list}
      ListHeaderComponent={<CreateCodeForm />}
      ListEmptyComponent={
        <View style={styles.center}>
          <Text style={styles.emptyText}>No invitation codes yet</Text>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  list: {
    padding: 16,
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  formTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  formRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  inputGroup: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
  },
  createButton: {
    backgroundColor: '#0284C7',
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  createButtonDisabled: {
    opacity: 0.6,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
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
  codeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  codeValue: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'monospace',
    marginRight: 8,
    color: '#1a1a1a',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  codeMeta: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
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
