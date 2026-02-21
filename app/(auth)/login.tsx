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
import { useLogin } from '@/features/auth/hooks/useLogin';

export default function LoginScreen() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { mutate, isPending, error, reset } = useLogin();

  const handleLogin = () => {
    const trimmedUser = username.trim();
    if (!trimmedUser || !password) return;

    mutate(
      { username: trimmedUser, password },
      { onSuccess: () => router.replace('/') },
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Log In</Text>

      <TextInput
        style={styles.input}
        placeholder="Username"
        value={username}
        onChangeText={(text) => {
          setUsername(text);
          if (error) reset();
        }}
        autoCapitalize="none"
        autoCorrect={false}
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={(text) => {
          setPassword(text);
          if (error) reset();
        }}
        secureTextEntry
      />

      {error ? (
        <Text style={styles.error}>{error.message}</Text>
      ) : null}

      <Pressable
        style={[styles.button, isPending && styles.disabled]}
        onPress={handleLogin}
        disabled={isPending}
      >
        {isPending ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <Text style={styles.buttonText}>Log In</Text>
        )}
      </Pressable>

      <Pressable onPress={() => router.push('/register')} style={styles.link}>
        <Text style={styles.linkText}>Don't have an account? Register</Text>
      </Pressable>
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
