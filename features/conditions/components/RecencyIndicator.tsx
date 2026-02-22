import { StyleSheet, View, Text } from 'react-native';
import { getRecencyInfo } from '../utils/recency';

interface RecencyIndicatorProps {
  createdAt: string;
}

export function RecencyIndicator({ createdAt }: RecencyIndicatorProps) {
  const { color, label, accessibilityLabel } = getRecencyInfo(createdAt);

  return (
    <View
      style={styles.container}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="text"
    >
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={[styles.label, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
  },
});
