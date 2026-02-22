import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUIStore } from '@/stores/useUIStore';

export default function OfflineBanner() {
  const isOffline = useUIStore((s) => s.isOffline);
  const pendingCount = useUIStore((s) => s.pendingActions.length);
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(-80)).current;

  useEffect(() => {
    Animated.timing(translateY, {
      toValue: isOffline ? 0 : -80,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [isOffline, translateY]);

  return (
    <Animated.View
      style={[
        styles.container,
        { paddingTop: insets.top + 4, transform: [{ translateY }] },
      ]}
      pointerEvents={isOffline ? 'auto' : 'none'}
    >
      <View style={styles.content}>
        <Text style={styles.text}>
          Using cached data
          {pendingCount > 0 && ` \u2022 ${pendingCount} pending`}
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#F59E0B',
    zIndex: 100,
  },
  content: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  text: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
