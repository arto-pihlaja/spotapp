import { useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useVerifyEmail } from '@/features/auth/hooks/usePasswordReset';

export default function VerifyEmailScreen() {
  const router = useRouter();
  const { token } = useLocalSearchParams<{ token: string }>();
  const { mutate, isPending, isSuccess, error } = useVerifyEmail();

  useEffect(() => {
    if (token) {
      mutate(token);
    }
  }, [token, mutate]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Email Verification</Text>

      {isPending ? (
        <>
          <ActivityIndicator size="large" color="#0284C7" />
          <Text style={styles.subtitle}>Verifying your email...</Text>
        </>
      ) : isSuccess ? (
        <>
          <Text style={styles.success}>Your email has been verified successfully!</Text>
          <Pressable
            style={styles.button}
            onPress={() => router.replace('/')}
          >
            <Text style={styles.buttonText}>Continue</Text>
          </Pressable>
        </>
      ) : error ? (
        <>
          <Text style={styles.error}>{error.message}</Text>
          <Pressable
            style={styles.button}
            onPress={() => router.replace('/')}
          >
            <Text style={styles.buttonText}>Go Home</Text>
          </Pressable>
        </>
      ) : !token ? (
        <Text style={styles.error}>Missing verification token.</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 24,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: '#666',
    marginTop: 16,
  },
  success: {
    fontSize: 15,
    color: '#16a34a',
    textAlign: 'center',
    marginBottom: 24,
  },
  error: {
    color: '#dc2626',
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 24,
  },
  button: {
    backgroundColor: '#0284C7',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
});
