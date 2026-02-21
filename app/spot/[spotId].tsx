import { StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

export default function SpotDetailScreen() {
  const { spotId } = useLocalSearchParams<{ spotId: string }>();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Spot Details</Text>
      <Text style={styles.subtitle}>Spot ID: {spotId}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: 'bold' },
  subtitle: { fontSize: 16, color: '#666', marginTop: 8 },
});
