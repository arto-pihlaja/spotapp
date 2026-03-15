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
import { useRouter, Link } from 'expo-router';
import { useRegister } from '@/features/auth/hooks/useRegister';
import BackToMapButton from '@/components/BackToMapButton';

export default function RegisterScreen() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [invitationCode, setInvitationCode] = useState('');
  const [validationError, setValidationError] = useState('');
  const [formTimestamp] = useState(() => Date.now());
  const { mutate, isPending, error, reset } = useRegister();

  const clearValidation = () => {
    setValidationError('');
    if (error) reset();
  };

  const handleRegister = () => {
    setValidationError('');

    const trimmedUser = username.trim();

    if (trimmedUser.length < 3 || trimmedUser.length > 30) {
      setValidationError('Username must be 3-30 characters.');
      return;
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(trimmedUser)) {
      setValidationError('Username can only contain letters, numbers, hyphens, and underscores.');
      return;
    }

    if (password.length < 8) {
      setValidationError('Password must be at least 8 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setValidationError('Passwords do not match.');
      return;
    }

    if (!invitationCode.trim()) {
      setValidationError('Invitation code is required.');
      return;
    }

    mutate(
      {
        username: trimmedUser,
        password,
        invitationCode: invitationCode.trim(),
        _hp: '',
        _ts: formTimestamp,
      },
      { onSuccess: () => router.replace('/') },
    );
  };

  return (
    <View style={styles.wrapper}>
      <BackToMapButton />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Register</Text>

        <Text style={styles.label}>Username</Text>
        <TextInput
          style={styles.input}
          placeholder="Username"
          value={username}
          onChangeText={(text) => { setUsername(text); clearValidation(); }}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <Text style={styles.hint}>Your handle is publicly visible. Avoid using your real name.</Text>

        <Text style={styles.label}>Password</Text>
        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={(text) => { setPassword(text); clearValidation(); }}
          secureTextEntry
        />

        <Text style={styles.label}>Confirm Password</Text>
        <TextInput
          style={styles.input}
          placeholder="Confirm password"
          value={confirmPassword}
          onChangeText={(text) => { setConfirmPassword(text); clearValidation(); }}
          secureTextEntry
        />

        <Text style={styles.label}>Invitation Code</Text>
        <TextInput
          style={styles.input}
          placeholder="Invitation code"
          value={invitationCode}
          onChangeText={(text) => { setInvitationCode(text); clearValidation(); }}
          autoCapitalize="none"
          autoCorrect={false}
        />

        <Text style={styles.gdprNotice}>
          We store your username, password (hashed), and content you create.
          Email is optional (for password recovery only). Use any name you
          like — it doesn't have to be real. Data is hosted in the EU. You can
          delete your account anytime.{' '}
          <Link href={'/privacy-policy' as any} style={styles.gdprLink}>
            Privacy Policy
          </Link>
        </Text>

        {validationError ? (
          <Text style={styles.error}>{validationError}</Text>
        ) : error ? (
          <Text style={styles.error}>{error.message}</Text>
        ) : null}

        <Pressable
          style={[styles.button, isPending && styles.disabled]}
          onPress={handleRegister}
          disabled={isPending}
        >
          {isPending ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.buttonText}>Register</Text>
          )}
        </Pressable>

        <Pressable onPress={() => router.push('/login')} style={styles.link}>
          <Text style={styles.linkText}>Already have an account? Log in</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scroll: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 24,
    textAlign: 'center',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  hint: {
    fontSize: 12,
    color: '#888',
    marginBottom: 12,
    marginTop: -8,
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
  gdprNotice: {
    fontSize: 12,
    color: '#888',
    lineHeight: 18,
    marginBottom: 12,
  },
  gdprLink: {
    color: '#0284C7',
    fontSize: 12,
  },
});
