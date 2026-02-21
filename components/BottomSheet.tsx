import { useRef, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Animated,
  PanResponder,
  Pressable,
  Dimensions,
  ScrollView,
} from 'react-native';

const WINDOW_HEIGHT = Dimensions.get('window').height;
const SNAP_POINTS = [0.3, 0.5, 0.9]; // 30%, 50%, 90% of screen

interface BottomSheetProps {
  visible: boolean;
  onDismiss: () => void;
  initialSnap?: number; // index into SNAP_POINTS, default 1 (50%)
  children: React.ReactNode;
}

export function BottomSheet({ visible, onDismiss, initialSnap = 1, children }: BottomSheetProps) {
  const translateY = useRef(new Animated.Value(WINDOW_HEIGHT)).current;
  const currentSnap = useRef(initialSnap);
  const overlayOpacity = useRef(new Animated.Value(0)).current;

  const getYForSnap = useCallback(
    (snapIndex: number) => WINDOW_HEIGHT * (1 - SNAP_POINTS[snapIndex]),
    [],
  );

  const animateTo = useCallback(
    (snapIndex: number) => {
      currentSnap.current = snapIndex;
      Animated.spring(translateY, {
        toValue: getYForSnap(snapIndex),
        useNativeDriver: false,
        tension: 80,
        friction: 12,
      }).start();
    },
    [translateY, getYForSnap],
  );

  const dismiss = useCallback(() => {
    Animated.timing(translateY, {
      toValue: WINDOW_HEIGHT,
      duration: 250,
      useNativeDriver: false,
    }).start();
    Animated.timing(overlayOpacity, {
      toValue: 0,
      duration: 250,
      useNativeDriver: false,
    }).start(() => onDismiss());
  }, [translateY, overlayOpacity, onDismiss]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => Math.abs(gestureState.dy) > 5,
      onPanResponderMove: (_, gestureState) => {
        const currentY = getYForSnap(currentSnap.current);
        const newY = currentY + gestureState.dy;
        const minY = getYForSnap(SNAP_POINTS.length - 1);
        translateY.setValue(Math.max(minY, Math.min(newY, WINDOW_HEIGHT)));
      },
      onPanResponderRelease: (_, gestureState) => {
        const currentY = getYForSnap(currentSnap.current) + gestureState.dy;
        const velocity = gestureState.vy;

        // Dismiss if dragged far down or fast downward flick
        if (velocity > 1.5 || currentY > WINDOW_HEIGHT * 0.85) {
          dismiss();
          return;
        }

        // Find nearest snap point
        let nearestSnap = 0;
        let nearestDist = Infinity;
        SNAP_POINTS.forEach((_, i) => {
          const dist = Math.abs(currentY - getYForSnap(i));
          if (dist < nearestDist) {
            nearestDist = dist;
            nearestSnap = i;
          }
        });

        // Bias toward direction of velocity
        if (velocity < -0.5 && nearestSnap < SNAP_POINTS.length - 1) {
          nearestSnap = Math.min(nearestSnap + 1, SNAP_POINTS.length - 1);
        } else if (velocity > 0.5 && nearestSnap > 0) {
          nearestSnap = Math.max(nearestSnap - 1, 0);
        }

        animateTo(nearestSnap);
      },
    }),
  ).current;

  useEffect(() => {
    if (visible) {
      Animated.timing(overlayOpacity, {
        toValue: 1,
        duration: 250,
        useNativeDriver: false,
      }).start();
      currentSnap.current = initialSnap;
      animateTo(initialSnap);
    }
  }, [visible, initialSnap, overlayOpacity, animateTo]);

  if (!visible) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {/* Overlay */}
      <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={dismiss} />
      </Animated.View>

      {/* Sheet */}
      <Animated.View style={[styles.sheet, { transform: [{ translateY }] }]}>
        {/* Drag handle */}
        <View {...panResponder.panHandlers} style={styles.handleArea}>
          <View style={styles.handle} />
        </View>

        {/* Content */}
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {children}
        </ScrollView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: WINDOW_HEIGHT,
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  handleArea: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  handle: {
    width: 32,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#ccc',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
});
