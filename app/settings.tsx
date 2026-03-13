import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useMe, useSetEmail } from '@/features/auth/hooks/usePasswordReset';
import { useQueryClient } from '@tanstack/react-query';

export default function SettingsScreen() {
  const queryClient = useQueryClient();
  const { data: me, isLoading, error: meError } = useMe();
  const setEmailMutation = useSetEmail();
  const [email, setEmail] = useState('');
  const [showEmailInput, setShowEmailInput] = useState(false);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);

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
    <View style={styles.container}>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: '#fff',
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
});
