import { useState, useEffect } from 'react';
import { StyleSheet, View, Pressable, Text, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/stores/useAuthStore';

export function AccountMenu() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const [menuOpen, setMenuOpen] = useState(false);

  // Close menu if user becomes null (e.g. session expired via 401 handler)
  useEffect(() => {
    if (!user) setMenuOpen(false);
  }, [user]);

  const handlePress = () => {
    if (user) {
      setMenuOpen((prev) => !prev);
    } else {
      router.push('/login');
    }
  };

  const handleLogout = () => {
    setMenuOpen(false);
    Alert.alert('Log out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log out', style: 'destructive', onPress: () => clearAuth() },
    ]);
  };

  const handleProfile = () => {
    setMenuOpen(false);
    if (user) {
      router.push(`/profile/${user.id}`);
    }
  };

  return (
    <>
      {/* Full-screen backdrop rendered as sibling so it covers the parent container */}
      {menuOpen && (
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={() => setMenuOpen(false)}
        />
      )}

      <View style={styles.wrapper}>
        <Pressable
          style={styles.accountButton}
          onPress={handlePress}
          accessibilityLabel={user ? 'Account menu' : 'Log in'}
          accessibilityRole="button"
        >
          <Text style={styles.accountText} numberOfLines={1}>
            {user ? user.username : 'Log In'}
          </Text>
        </Pressable>

        {menuOpen && (
          <View style={styles.dropdown}>
            <Pressable style={styles.menuItem} onPress={handleProfile}>
              <Text style={styles.menuText}>Profile</Text>
            </Pressable>
            <View style={styles.separator} />
            <Pressable style={styles.menuItem} onPress={handleLogout}>
              <Text style={[styles.menuText, styles.logoutText]}>Log out</Text>
            </Pressable>
          </View>
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    top: 48,
    left: 16,
    zIndex: 20,
  },
  accountButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    maxWidth: 140,
  },
  accountText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0284C7',
  },
  dropdown: {
    position: 'absolute',
    top: 44,
    left: 0,
    minWidth: 140,
    backgroundColor: '#fff',
    borderRadius: 12,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    zIndex: 21,
    overflow: 'hidden',
  },
  menuItem: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: 44,
    justifyContent: 'center',
  },
  menuText: {
    fontSize: 15,
    color: '#374151',
  },
  logoutText: {
    color: '#dc2626',
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#e5e7eb',
    marginHorizontal: 12,
  },
});
