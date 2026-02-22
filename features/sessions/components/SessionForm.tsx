import { useState } from 'react';
import { StyleSheet, View, Text, Pressable, ActivityIndicator } from 'react-native';
import { useCreateSession } from '../hooks/useCreateSession';
import { SPORT_OPTIONS, TIME_PRESETS } from '../types';
import type { SportType, TimePreset, CreateSessionInput } from '../types';

interface SessionFormProps {
  spotId: string;
  onDone: () => void;
}

function computeScheduledAt(preset: TimePreset): string | undefined {
  if (preset === 'now') return undefined;
  const hours = parseInt(preset.replace('+', '').replace('h', ''), 10);
  return new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
}

export function SessionForm({ spotId, onDone }: SessionFormProps) {
  const [selectedTime, setSelectedTime] = useState<TimePreset>('now');
  const [selectedSport, setSelectedSport] = useState<SportType | null>(null);
  const mutation = useCreateSession(spotId);

  const handleSubmit = () => {
    if (!selectedSport) return;

    const input: CreateSessionInput = {
      type: selectedTime === 'now' ? 'now' : 'planned',
      sportType: selectedSport,
      scheduledAt: computeScheduledAt(selectedTime),
    };

    mutation.mutate(input, { onSuccess: onDone });
  };

  return (
    <View style={styles.container}>
      {/* Time presets */}
      <Text style={styles.label}>When?</Text>
      <View style={styles.chipRow}>
        {TIME_PRESETS.map((preset) => (
          <Pressable
            key={preset.value}
            style={[styles.chip, selectedTime === preset.value && styles.chipActive]}
            onPress={() => setSelectedTime(preset.value)}
          >
            <Text style={[styles.chipText, selectedTime === preset.value && styles.chipTextActive]}>
              {preset.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Sport selector */}
      <Text style={styles.label}>Sport</Text>
      <View style={styles.chipRow}>
        {SPORT_OPTIONS.map((sport) => (
          <Pressable
            key={sport.value}
            style={[styles.chip, selectedSport === sport.value && styles.chipActive]}
            onPress={() => setSelectedSport(sport.value)}
          >
            <Text style={[styles.chipText, selectedSport === sport.value && styles.chipTextActive]}>
              {sport.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {mutation.error && (
        <Text style={styles.errorText}>Failed to create session. Try again.</Text>
      )}

      {/* Action buttons */}
      <View style={styles.actions}>
        <Pressable style={styles.cancelButton} onPress={onDone}>
          <Text style={styles.cancelText}>Cancel</Text>
        </Pressable>
        <Pressable
          style={[styles.submitButton, (!selectedSport || mutation.isPending) && styles.submitDisabled]}
          onPress={handleSubmit}
          disabled={!selectedSport || mutation.isPending}
        >
          {mutation.isPending ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.submitText}>
              {selectedTime === 'now' ? "I'm Going Now" : "I'm Planning"}
            </Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#555',
    marginBottom: 6,
    marginTop: 8,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  chipActive: {
    backgroundColor: '#0284C7',
    borderColor: '#0284C7',
  },
  chipText: {
    fontSize: 13,
    color: '#333',
    fontWeight: '500',
  },
  chipTextActive: {
    color: '#fff',
  },
  errorText: {
    fontSize: 13,
    color: '#d32f2f',
    marginTop: 8,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  cancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
  },
  submitButton: {
    flex: 2,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#0284C7',
  },
  submitDisabled: {
    opacity: 0.5,
  },
  submitText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
