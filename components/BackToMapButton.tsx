import { Pressable, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function BackToMapButton() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <Pressable
      style={[styles.button, { top: insets.top + 8 }]}
      onPress={() => router.back()}
      accessibilityLabel="Back"
      accessibilityRole="button"
    >
      <Text style={styles.chevron}>‹</Text>
      <Text style={styles.text}>Back</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 10,
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  chevron: {
    fontSize: 28,
    color: '#0284C7',
    lineHeight: 28,
    marginRight: 2,
  },
  text: {
    fontSize: 17,
    color: '#0284C7',
  },
});
