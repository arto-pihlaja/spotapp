import { useState, useCallback, useMemo } from 'react';
import { StyleSheet, View, Text, Pressable } from 'react-native';

const PRESETS = [
  { label: 'Now', hours: 0 },
  { label: '+1h', hours: 1 },
  { label: '+2h', hours: 2 },
  { label: '+3h', hours: 3 },
] as const;

export interface TimeWindow {
  timeFrom: string;
  timeTo: string;
}

interface TimeSliderProps {
  onChange: (window: TimeWindow) => void;
}

function computeWindow(hoursOffset: number): TimeWindow {
  const now = new Date();
  if (hoursOffset === 0) {
    // "Now" — show sessions from now to +90min (matches NOW session expiry)
    return {
      timeFrom: now.toISOString(),
      timeTo: new Date(now.getTime() + 90 * 60 * 1000).toISOString(),
    };
  }
  // "+Xh" — show sessions in a 1-hour window centered on the target time
  const target = new Date(now.getTime() + hoursOffset * 60 * 60 * 1000);
  const halfWindow = 30 * 60 * 1000; // 30 min
  return {
    timeFrom: new Date(target.getTime() - halfWindow).toISOString(),
    timeTo: new Date(target.getTime() + halfWindow).toISOString(),
  };
}

export function TimeSlider({ onChange }: TimeSliderProps) {
  const [selected, setSelected] = useState(0); // index into PRESETS

  const handleSelect = useCallback(
    (index: number) => {
      setSelected(index);
      onChange(computeWindow(PRESETS[index].hours));
    },
    [onChange],
  );

  return (
    <View style={styles.container}>
      {PRESETS.map((preset, i) => (
        <Pressable
          key={preset.label}
          style={[styles.chip, selected === i && styles.chipActive]}
          onPress={() => handleSelect(i)}
          accessibilityRole="button"
          accessibilityLabel={`Filter sessions: ${preset.label}`}
          accessibilityState={{ selected: selected === i }}
        >
          <Text style={[styles.chipText, selected === i && styles.chipTextActive]}>
            {preset.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderRadius: 24,
    alignSelf: 'center',
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
});
