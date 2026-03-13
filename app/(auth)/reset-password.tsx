import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useResetPassword } from '@/features/auth/hooks/usePasswordReset';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { token } = useLocalSearchParams<{ token: string }>();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [validationError, setValidationError] = useState('');
  const { mutate, isPending, isSuccess, error, reset } = useResetPassword();

  const handleSubmit = () => {
    setValidationError('');

    if (!token) {
      setValidationError('Missing reset token. Please use the link from your email.');
      return;
    }

    if (newPassword.length < 8) {
      setValidationError('Password must be at least 8 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setValidationError('Passwords do not match.');
      return;
    }

    mutate({ token, newPassword });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Reset Password</Text>

      {isSuccess ? (
        <>
          <Text style={styles.success}>
            Your password has been reset successfully.
          </Text>
          <Pressable
            style={styles.button}
            onPress={() => router.replace('/login')}
          >
            <Text style={styles.buttonText}>Go to Login</Text>
          </Pressable>
        </>
      ) : (
        <>
          <TextInput
            style={styles.input}
            placeholder="New password"
            value={newPassword}
            onChangeText={(text) => {
              setNewPassword(text);
              setValidationError('');
              if (error) reset();
            }}
            secureTextEntry
          />

          <TextInput
            style={styles.input}
            placeholder="Confirm new password"
            value={confirmPassword}
            onChangeText={(text) => {
              setConfirmPassword(text);
              setValidationError('');
              if (error) reset();
            }}
            secureTextEntry
          />

          {validationError ? (
            <Text style={styles.error}>{validationError}</Text>
          ) : error ? (
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
              <Text style={styles.buttonText}>Reset Password</Text>
            )}
          </Pressable>

          <Pressable onPress={() => router.replace('/login')} style={styles.link}>
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
    marginBottom: 24,
    textAlign: 'center',
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
