import { StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useAuthStore } from '@/stores/useAuthStore';
import { GhostProfile } from '@/features/auth/components/GhostProfile';

export default function ProfileScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const isAuthenticated = useAuthStore((s) => !!s.accessToken);

  if (!isAuthenticated) {
    return (
      <View style={styles.center}>
        <Text style={styles.message}>Please log in to view profiles</Text>
      </View>
    );
  }

  if (!userId) {
    return (
      <View style={styles.center}>
        <Text style={styles.message}>Invalid profile</Text>
      </View>
    );
  }

  return <GhostProfile userId={userId} />;
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
  },
  message: {
    fontSize: 16,
    color: '#6B7280',
  },
});
