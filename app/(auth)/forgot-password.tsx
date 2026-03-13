import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useForgotPassword } from '@/features/auth/hooks/usePasswordReset';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const { mutate, isPending, isSuccess, error, reset } = useForgotPassword();

  const handleSubmit = () => {
    const trimmed = email.trim();
    if (!trimmed) return;
    mutate(trimmed);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Forgot Password</Text>

      {isSuccess ? (
        <>
          <Text style={styles.success}>
            If that email is registered, you'll receive a reset link.
          </Text>
          <Pressable onPress={() => router.back()} style={styles.link}>
            <Text style={styles.linkText}>Back to Login</Text>
          </Pressable>
        </>
      ) : (
        <>
          <Text style={styles.subtitle}>
            Enter your email address and we'll send you a link to reset your password.
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Email"
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              if (error) reset();
            }}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
          />

          {error ? (
            <Text style={styles.error}>{error.message}</Text>
          ) : null}

          <Pressable
            style={[styles.button, isPending && styles.disabled]}
            onPress={handleSubmit}
            disabled={isPending}
          >
            {isPending ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.buttonText}>Send Reset Link</Text>
            )}
          </Pressable>

          <Pressable onPress={() => router.back()} style={styles.link}>
            <Text style={styles.linkText}>Back to Login</Text>
          </Pressable>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  success: {
    fontSize: 15,
    color: '#16a34a',
    textAlign: 'center',
    marginBottom: 24,
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
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  disabled: {
    opacity: 0.6,
  },
  link: {
    marginTop: 16,
    alignItems: 'center',
  },
  linkText: {
    color: '#0284C7',
    fontSize: 14,
  },
});
