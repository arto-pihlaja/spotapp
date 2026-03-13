import { createElement, useState, useCallback } from 'react';
import { StyleSheet, View, Text, Pressable, Platform } from 'react-native';
import { TIME_PRESETS } from '../types';
import type { TimePreset } from '../types';

// Only import native picker on non-web platforms
const DateTimePicker =
  Platform.OS !== 'web'
    ? require('@react-native-community/datetimepicker').default
    : null;

export interface TimeWindow {
  timeFrom: string;
  timeTo: string;
}

interface TimeSliderProps {
  onChange: (window: TimeWindow) => void;
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

function computeWindow(preset: TimePreset, customDate: Date): TimeWindow {
  const now = new Date();
  if (preset === 'now') {
    // "Now" — show sessions from now to +90min (matches NOW session expiry)
    return {
      timeFrom: now.toISOString(),
      timeTo: new Date(now.getTime() + 90 * 60 * 1000).toISOString(),
    };
  }
  if (preset === 'custom') {
    // 1-hour window centered on the custom date
    const halfWindow = 30 * 60 * 1000;
    return {
      timeFrom: new Date(customDate.getTime() - halfWindow).toISOString(),
      timeTo: new Date(customDate.getTime() + halfWindow).toISOString(),
    };
  }
  // "+Xh" — show sessions in a 1-hour window centered on the target time
  const hours = parseInt(preset.replace('+', '').replace('h', ''), 10);
  const target = new Date(now.getTime() + hours * 60 * 60 * 1000);
  const halfWindow = 30 * 60 * 1000;
  return {
    timeFrom: new Date(target.getTime() - halfWindow).toISOString(),
    timeTo: new Date(target.getTime() + halfWindow).toISOString(),
  };
}

export function TimeSlider({ onChange }: TimeSliderProps) {
  const [selected, setSelected] = useState<TimePreset>('now');
  const [customDate, setCustomDate] = useState<Date>(() => roundToNextFiveMinutes(new Date()));
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const handleSelect = useCallback(
    (preset: TimePreset) => {
      setSelected(preset);
      onChange(computeWindow(preset, customDate));
    },
    [onChange, customDate],
  );

  const updateCustomDate = useCallback(
    (date: Date) => {
      setCustomDate(date);
      if (selected === 'custom') {
        onChange(computeWindow('custom', date));
      }
    },
    [onChange, selected],
  );

  const handleDateChange = (_event: unknown, date?: Date) => {
    if (Platform.OS === 'android') setShowDatePicker(false);
    if (date) {
      const updated = new Date(date);
      updated.setHours(customDate.getHours(), customDate.getMinutes(), 0, 0);
      updateCustomDate(updated);
    }
  };

  const handleTimeChange = (_event: unknown, date?: Date) => {
    if (Platform.OS === 'android') setShowTimePicker(false);
    if (date) {
      const updated = new Date(customDate);
      updated.setHours(date.getHours(), date.getMinutes(), 0, 0);
      updateCustomDate(updated);
    }
  };

  const handleWebDateTimeChange = (e: { target: { value: string } }) => {
    const val = e.target.value;
    if (val) updateCustomDate(new Date(val));
  };

  const formatDate = (d: Date) =>
    d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });

  const formatTime = (d: Date) =>
    d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });

  return (
    <View style={styles.wrapper}>
      <View style={styles.container}>
        {TIME_PRESETS.map((preset) => (
          <Pressable
            key={preset.value}
            style={[styles.chip, selected === preset.value && styles.chipActive]}
            onPress={() => handleSelect(preset.value)}
            accessibilityRole="button"
            accessibilityLabel={`Filter sessions: ${preset.label}`}
            accessibilityState={{ selected: selected === preset.value }}
          >
            <Text style={[styles.chipText, selected === preset.value && styles.chipTextActive]}>
              {preset.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {selected === 'custom' && (
        <View style={styles.customPickerContainer}>
          {Platform.OS === 'web' ? (
            createElement('input', {
              type: 'datetime-local',
              value: toDateTimeLocalValue(customDate),
              onChange: handleWebDateTimeChange,
              style: {
                fontSize: 14,
                padding: 8,
                borderRadius: 8,
                border: '1px solid #d0d0d0',
                width: '100%',
                backgroundColor: '#fff',
                fontFamily: 'inherit',
                color: '#333',
              },
            })
          ) : (
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
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
  },
  container: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderRadius: 24,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
  },
  chipActive: {
    backgroundColor: '#0284C7',
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#555',
  },
  chipTextActive: {
    color: '#fff',
  },
  customPickerContainer: {
    marginTop: 8,
    padding: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  pickerRow: {
    flexDirection: 'row',
    gap: 8,
  },
  pickerButton: {
    flex: 1,
    padding: 8,
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
    fontSize: 13,
    color: '#333',
    fontWeight: '600',
  },
});
