import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useMe, useSetEmail } from '@/features/auth/hooks/usePasswordReset';
import { useDeleteAccount } from '@/features/auth/hooks/useDeleteAccount';
import { useAuthStore } from '@/stores/useAuthStore';
import { useQueryClient } from '@tanstack/react-query';

export default function SettingsScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: me, isLoading, error: meError } = useMe();
  const setEmailMutation = useSetEmail();
  const deleteMutation = useDeleteAccount();
  const [email, setEmail] = useState('');
  const [showEmailInput, setShowEmailInput] = useState(false);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');

  const handleSetEmail = () => {
    const trimmed = email.trim();
    if (!trimmed) return;

    setEmailMutation.mutate(trimmed, {
      onSuccess: () => {
        setPendingEmail(trimmed);
        setShowEmailInput(false);
        setEmail('');
        queryClient.invalidateQueries({ queryKey: ['me'] });
      },
    });
  };

  const handleDeleteAccount = () => {
    if (!deletePassword) return;

    deleteMutation.mutate(deletePassword, {
      onSuccess: () => {
        useAuthStore.getState().clearAuth();
        router.replace('/login');
      },
    });
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#0284C7" />
      </View>
    );
  }

  // Use server data when available, fall back to local pending state
  const displayEmail = me?.email ?? pendingEmail;
  const isVerified = !!me?.emailVerifiedAt;

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
      <Text style={styles.sectionTitle}>Email</Text>

      {meError ? (
        <Text style={styles.error}>Failed to load profile: {meError.message}</Text>
      ) : null}

      {displayEmail ? (
        <View style={styles.emailRow}>
          <Text style={styles.emailText}>{displayEmail}</Text>
          <Text style={isVerified ? styles.verified : styles.unverified}>
            {isVerified ? 'Verified' : 'Pending verification'}
          </Text>
        </View>
      ) : (
        <Text style={styles.noEmail}>No email set</Text>
      )}

      {pendingEmail && !me?.email ? (
        <Text style={styles.hint}>
          Check your server console for the verification link (dev mode).
        </Text>
      ) : null}

      {!showEmailInput ? (
        <Pressable
          style={styles.secondaryButton}
          onPress={() => { setShowEmailInput(true); setEmailMutation.reset(); }}
        >
          <Text style={styles.secondaryButtonText}>
            {displayEmail
              ? isVerified
                ? 'Update Email'
                : 'Resend Verification'
              : 'Set Email'}
          </Text>
        </Pressable>
      ) : (
        <>
          <TextInput
            style={styles.input}
            placeholder="Email address"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
          />

          {setEmailMutation.error ? (
            <Text style={styles.error}>{setEmailMutation.error.message}</Text>
          ) : null}

          <View style={styles.buttonRow}>
            <Pressable
              style={[styles.button, setEmailMutation.isPending && styles.disabled]}
              onPress={handleSetEmail}
              disabled={setEmailMutation.isPending}
            >
              {setEmailMutation.isPending ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.buttonText}>Save & Verify</Text>
              )}
            </Pressable>
            <Pressable
              style={styles.cancelButton}
              onPress={() => { setShowEmailInput(false); setEmail(''); }}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
          </View>
        </>
      )}

      {/* Privacy Policy link */}
      <Pressable
        style={styles.privacyLink}
        onPress={() => router.push('/privacy-policy' as any)}
      >
        <Text style={styles.privacyLinkText}>Privacy Policy</Text>
      </Pressable>

      {/* Danger Zone */}
      <View style={styles.dangerZone}>
        <Text style={styles.dangerTitle}>Danger Zone</Text>

        {!showDeleteConfirm ? (
          <Pressable
            style={styles.deleteButton}
            onPress={() => { setShowDeleteConfirm(true); deleteMutation.reset(); }}
          >
            <Text style={styles.deleteButtonText}>Delete Account</Text>
          </Pressable>
        ) : (
          <>
            <Text style={styles.deleteWarning}>
              This will permanently delete your account and all associated data
              (sessions, condition reports, spots). Wiki contributions will be
              anonymized. This action cannot be undone.
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Enter your password to confirm"
              value={deletePassword}
              onChangeText={setDeletePassword}
              secureTextEntry
            />

            {deleteMutation.error ? (
              <Text style={styles.error}>{deleteMutation.error.message}</Text>
            ) : null}

            <View style={styles.buttonRow}>
              <Pressable
                style={[styles.deleteConfirmButton, deleteMutation.isPending && styles.disabled]}
                onPress={handleDeleteAccount}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.deleteConfirmText}>Permanently Delete</Text>
                )}
              </Pressable>
              <Pressable
                style={styles.cancelButton}
                onPress={() => { setShowDeleteConfirm(false); setDeletePassword(''); }}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>
            </View>
          </>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    padding: 24,
    paddingBottom: 48,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  emailRow: {
    marginBottom: 12,
  },
  emailText: {
    fontSize: 16,
    marginBottom: 4,
  },
  verified: {
    fontSize: 13,
    color: '#16a34a',
  },
  unverified: {
    fontSize: 13,
    color: '#d97706',
  },
  noEmail: {
    fontSize: 15,
    color: '#888',
    marginBottom: 12,
  },
  hint: {
    fontSize: 13,
    color: '#6B7280',
    fontStyle: 'italic',
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
  },
  error: {
    color: '#dc2626',
    fontSize: 13,
    marginBottom: 8,
  },
  button: {
    backgroundColor: '#0284C7',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 15,
    color: '#fff',
    fontWeight: '600',
  },
  disabled: {
    opacity: 0.6,
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: '#0284C7',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  secondaryButtonText: {
    color: '#0284C7',
    fontSize: 14,
    fontWeight: '500',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  cancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  cancelText: {
    color: '#666',
    fontSize: 14,
  },
  privacyLink: {
    marginTop: 32,
    marginBottom: 8,
  },
  privacyLinkText: {
    color: '#0284C7',
    fontSize: 14,
  },
  dangerZone: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 24,
    marginTop: 16,
  },
  dangerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#dc2626',
    marginBottom: 12,
  },
  deleteButton: {
    borderWidth: 1,
    borderColor: '#dc2626',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  deleteButtonText: {
    color: '#dc2626',
    fontSize: 14,
    fontWeight: '500',
  },
  deleteWarning: {
    fontSize: 13,
    color: '#666',
    lineHeight: 20,
    marginBottom: 16,
  },
  deleteConfirmButton: {
    backgroundColor: '#dc2626',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  deleteConfirmText: {
    fontSize: 15,
    color: '#fff',
    fontWeight: '600',
  },
});
