import { createElement, useState } from 'react';
import { StyleSheet, View, Text, Pressable, ActivityIndicator, Platform } from 'react-native';
import { useCreateSession } from '../hooks/useCreateSession';
import { SPORT_OPTIONS, TIME_PRESETS } from '../types';
import type { SportType, TimePreset, CreateSessionInput } from '../types';

// Only import native picker on non-web platforms
const DateTimePicker =
  Platform.OS !== 'web'
    ? require('@react-native-community/datetimepicker').default
    : null;

interface SessionFormProps {
  spotId: string;
  onDone: () => void;
}

/** Minimum minutes into the future for custom time */
const MIN_FUTURE_MINUTES = 1;

function computeScheduledAt(preset: TimePreset, customDate: Date): string | undefined {
  if (preset === 'now') return undefined;
  if (preset === 'custom') return customDate.toISOString();
  const hours = parseInt(preset.replace('+', '').replace('h', ''), 10);
  return new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
}

function roundToNextFiveMinutes(date: Date): Date {
  const d = new Date(date);
  const mins = d.getMinutes();
  const rounded = Math.ceil(mins / 5) * 5;
  d.setMinutes(rounded, 0, 0);
  if (rounded === mins) {
    d.setMinutes(mins + 5, 0, 0);
  }
  return d;
}

/** Format Date to `YYYY-MM-DDTHH:MM` for HTML datetime-local input */
function toDateTimeLocalValue(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export function SessionForm({ spotId, onDone }: SessionFormProps) {
  const [selectedTime, setSelectedTime] = useState<TimePreset>('now');
  const [customDate, setCustomDate] = useState<Date>(() => roundToNextFiveMinutes(new Date()));
  const [selectedSport, setSelectedSport] = useState<SportType | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const mutation = useCreateSession(spotId);

  const isCustomPast = selectedTime === 'custom' && customDate <= new Date();

  const handleSubmit = () => {
    if (!selectedSport) return;
    if (isCustomPast) return;

    const input: CreateSessionInput = {
      type: selectedTime === 'now' ? 'now' : 'planned',
      sportType: selectedSport,
      scheduledAt: computeScheduledAt(selectedTime, customDate),
    };

    mutation.mutate(input, { onSuccess: onDone });
  };

  const handleDateChange = (_event: unknown, date?: Date) => {
    if (Platform.OS === 'android') setShowDatePicker(false);
    if (date) {
      const updated = new Date(date);
      updated.setHours(customDate.getHours(), customDate.getMinutes(), 0, 0);
      setCustomDate(updated);
    }
  };

  const handleTimeChange = (_event: unknown, date?: Date) => {
    if (Platform.OS === 'android') setShowTimePicker(false);
    if (date) {
      const updated = new Date(customDate);
      updated.setHours(date.getHours(), date.getMinutes(), 0, 0);
      setCustomDate(updated);
    }
  };

  const handleWebDateTimeChange = (e: { target: { value: string } }) => {
    const val = e.target.value;
    if (val) setCustomDate(new Date(val));
  };

  const formatDate = (d: Date) =>
    d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });

  const formatTime = (d: Date) =>
    d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });

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

      {/* Custom date/time picker */}
      {selectedTime === 'custom' && (
        <View style={styles.customPickerContainer}>
          {Platform.OS === 'web' ? (
            /* Web: native HTML datetime-local input */
            createElement('input', {
              type: 'datetime-local',
              value: toDateTimeLocalValue(customDate),
              min: toDateTimeLocalValue(new Date()),
              onChange: handleWebDateTimeChange,
              style: {
                fontSize: 16,
                padding: 10,
                borderRadius: 8,
                border: '1px solid #d0d0d0',
                width: '100%',
                backgroundColor: '#fff',
                fontFamily: 'inherit',
                color: '#333',
              },
            })
          ) : (
            /* Native: button triggers + DateTimePicker */
            <>
              <View style={styles.pickerRow}>
                <Pressable
                  style={styles.pickerButton}
                  onPress={() => {
                    setShowDatePicker(true);
                    setShowTimePicker(false);
                  }}
                >
                  <Text style={styles.pickerButtonLabel}>Date</Text>
                  <Text style={styles.pickerButtonValue}>{formatDate(customDate)}</Text>
                </Pressable>

                <Pressable
                  style={styles.pickerButton}
                  onPress={() => {
                    setShowTimePicker(true);
                    setShowDatePicker(false);
                  }}
                >
                  <Text style={styles.pickerButtonLabel}>Time</Text>
                  <Text style={styles.pickerButtonValue}>{formatTime(customDate)}</Text>
                </Pressable>
              </View>

              {showDatePicker && DateTimePicker && (
                <DateTimePicker
                  value={customDate}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  minimumDate={new Date()}
                  onChange={handleDateChange}
                />
              )}

              {showTimePicker && DateTimePicker && (
                <DateTimePicker
                  value={customDate}
                  mode="time"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  minuteInterval={5}
                  onChange={handleTimeChange}
                />
              )}
            </>
          )}

          {isCustomPast && (
            <Text style={styles.errorText}>Selected time must be in the future.</Text>
          )}
        </View>
      )}

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
          style={[styles.submitButton, (!selectedSport || mutation.isPending || isCustomPast) && styles.submitDisabled]}
          onPress={handleSubmit}
          disabled={!selectedSport || mutation.isPending || isCustomPast}
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
  customPickerContainer: {
    marginTop: 10,
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  pickerRow: {
    flexDirection: 'row',
    gap: 10,
  },
  pickerButton: {
    flex: 1,
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d0d0d0',
    alignItems: 'center',
  },
  pickerButtonLabel: {
    fontSize: 11,
    color: '#888',
    fontWeight: '500',
    marginBottom: 2,
  },
  pickerButtonValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
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
