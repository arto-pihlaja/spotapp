import { useState, useEffect } from 'react';
import { StyleSheet, View, Pressable, Text, Alert, Platform } from 'react-native';
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
    setMenuOpen((prev) => !prev);
  };

  const handleLogin = () => {
    setMenuOpen(false);
    router.push('/login');
  };

  const handleHelp = () => {
    setMenuOpen(false);
    router.push('/help');
  };

  const handleLogout = () => {
    setMenuOpen(false);
    if (Platform.OS === 'web') {
      if (window.confirm('Are you sure you want to log out?')) {
        clearAuth();
      }
    } else {
      Alert.alert('Log out', 'Are you sure you want to log out?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Log out', style: 'destructive', onPress: () => clearAuth() },
      ]);
    }
  };

  const handleProfile = () => {
    if (user) router.push(`/profile/${user.id}`);
    setMenuOpen(false);
  };

  const handleSettings = () => {
    router.push('/settings');
    setMenuOpen(false);
  };

  return (
    <>
      {/* Full-screen backdrop — large offsets to extend beyond the topBar container */}
      {menuOpen && (
        <Pressable
          style={styles.backdrop}
          onPress={() => setMenuOpen(false)}
        />
      )}

      <View style={styles.wrapper}>
        <Pressable
          style={styles.accountButton}
          onPress={handlePress}
          accessibilityLabel="Menu"
          accessibilityRole="button"
        >
          <Text style={styles.hamburgerText}>{'\u2630'}</Text>
        </Pressable>

        {menuOpen && (
          <View style={styles.dropdown}>
            {user ? (
              <>
                <Pressable style={styles.menuItem} onPress={handleProfile}>
                  <Text style={styles.menuText}>Profile</Text>
                </Pressable>
                <View style={styles.separator} />
                <Pressable style={styles.menuItem} onPress={handleSettings}>
                  <Text style={styles.menuText}>Settings</Text>
                </Pressable>
                <View style={styles.separator} />
                <Pressable style={styles.menuItem} onPress={handleHelp}>
                  <Text style={styles.menuText}>Help</Text>
                </Pressable>
                <View style={styles.separator} />
                <Pressable style={styles.menuItem} onPress={handleLogout}>
                  <Text style={[styles.menuText, styles.logoutText]}>Log out</Text>
                </Pressable>
              </>
            ) : (
              <>
                <Pressable style={styles.menuItem} onPress={handleLogin}>
                  <Text style={styles.menuText}>Log in</Text>
                </Pressable>
                <View style={styles.separator} />
                <Pressable style={styles.menuItem} onPress={handleHelp}>
                  <Text style={styles.menuText}>Help</Text>
                </Pressable>
              </>
            )}
          </View>
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    top: -200,
    left: -200,
    right: -2000,
    bottom: -2000,
    zIndex: 19,
  },
  wrapper: {
    zIndex: 20,
    marginLeft: 0,
  },
  accountButton: {
    backgroundColor: '#fff',
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  hamburgerText: {
    fontSize: 20,
    color: '#374151',
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
