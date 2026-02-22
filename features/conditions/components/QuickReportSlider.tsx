import { useState, useRef, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  PanResponder,
  AccessibilityInfo,
  Platform,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { useCreateCondition } from '../hooks/useCreateCondition';
import { getCardinalLabel } from '../types';

const CARDINAL_DIRECTIONS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'] as const;
const CARDINAL_ANGLES: Record<string, number> = {
  N: 0, NE: 45, E: 90, SE: 135, S: 180, SW: 225, W: 270, NW: 315,
};
const SPEED_STEPS = [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20];
const COMPASS_RADIUS = 90;
const WIND_RING_RADII = [
  { speed: 5, radius: COMPASS_RADIUS * 0.25 },
  { speed: 10, radius: COMPASS_RADIUS * 0.5 },
  { speed: 15, radius: COMPASS_RADIUS * 0.75 },
  { speed: 20, radius: COMPASS_RADIUS * 1.0 },
];

function snapToAngle(angleDeg: number): number {
  const normalized = ((angleDeg % 360) + 360) % 360;
  return Math.round(normalized / 5) * 5 % 360;
}

function snapToSpeed(distance: number): number {
  const ratio = Math.min(distance / COMPASS_RADIUS, 1);
  const raw = ratio * 20;
  return Math.round(raw / 2) * 2;
}

interface QuickReportSliderProps {
  spotId: string;
  onDone: () => void;
}

export function QuickReportSlider({ spotId, onDone }: QuickReportSliderProps) {
  const [waveHeight, setWaveHeight] = useState(1.0);
  const [windSpeed, setWindSpeed] = useState(0);
  const [windAngle, setWindAngle] = useState(0);
  const [showAccessible, setShowAccessible] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const compassCenter = useRef({ x: 0, y: 0 });

  const mutation = useCreateCondition(spotId);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        handleWindTouch(evt.nativeEvent.locationX, evt.nativeEvent.locationY);
      },
      onPanResponderMove: (evt) => {
        handleWindTouch(evt.nativeEvent.locationX, evt.nativeEvent.locationY);
      },
    }),
  ).current;

  const handleWindTouch = useCallback((touchX: number, touchY: number) => {
    const cx = compassCenter.current.x;
    const cy = compassCenter.current.y;
    const dx = touchX - cx;
    const dy = touchY - cy;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const angle = (Math.atan2(dx, -dy) * 180) / Math.PI;

    setWindAngle(snapToAngle(angle));
    setWindSpeed(snapToSpeed(distance));
  }, []);

  const handleSubmit = async () => {
    try {
      await mutation.mutateAsync({
        waveHeight,
        windSpeed: windSpeed > 0 ? windSpeed : undefined,
        windDirection: windSpeed > 0 ? windAngle : undefined,
      });
      setSubmitted(true);
      setTimeout(onDone, 2000);
    } catch {
      // Error handled by mutation state
    }
  };

  if (submitted) {
    return (
      <View style={styles.successContainer}>
        <Text style={styles.successIcon}>✓</Text>
        <Text style={styles.successText}>Thanks!</Text>
      </View>
    );
  }

  // Compute arrow endpoint for wind indicator
  const arrowAngleRad = (windAngle * Math.PI) / 180;
  const arrowRatio = windSpeed / 20;
  const arrowLen = arrowRatio * COMPASS_RADIUS;
  const arrowX = Math.sin(arrowAngleRad) * arrowLen;
  const arrowY = -Math.cos(arrowAngleRad) * arrowLen;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Report Conditions</Text>

      {/* Wave Height */}
      <View style={styles.field}>
        <Text style={styles.label}>Wave Height</Text>
        <Text style={styles.value}>{waveHeight >= 2.5 ? '2+' : waveHeight.toFixed(1)} m</Text>
        <Slider
          style={styles.slider}
          minimumValue={0}
          maximumValue={2.5}
          step={0.5}
          value={waveHeight}
          onValueChange={setWaveHeight}
          minimumTrackTintColor="#0284C7"
          maximumTrackTintColor="#E2E8F0"
          thumbTintColor="#0284C7"
          accessibilityLabel="Wave height in meters"
          accessibilityValue={{ min: 0, max: 2.5, now: waveHeight }}
        />
        <View style={styles.sliderLabels}>
          <Text style={styles.sliderLabel}>0 m</Text>
          <Text style={styles.sliderLabel}>1 m</Text>
          <Text style={styles.sliderLabel}>2+ m</Text>
        </View>
      </View>

      {/* Wind — directional control */}
      <View style={styles.field}>
        <View style={styles.windHeader}>
          <Text style={styles.label}>Wind</Text>
          <Pressable onPress={() => setShowAccessible(!showAccessible)}>
            <Text style={styles.toggleLink}>{showAccessible ? 'Use compass' : 'Use text input'}</Text>
          </Pressable>
        </View>

        {showAccessible ? (
          <AccessibleWindInput
            speed={windSpeed}
            angle={windAngle}
            onSpeedChange={setWindSpeed}
            onAngleChange={setWindAngle}
          />
        ) : (
          <View style={styles.compassWrapper}>
            <Text style={styles.windSummary}>
              {windSpeed > 0 ? `${windSpeed} m/s ${getCardinalLabel(windAngle)} ${windAngle}°` : 'Drag to set wind'}
            </Text>
            <View
              style={styles.compass}
              onLayout={(e) => {
                const { width, height } = e.nativeEvent.layout;
                compassCenter.current = { x: width / 2, y: height / 2 };
              }}
              {...panResponder.panHandlers}
            >
              {/* Concentric circles */}
              {WIND_RING_RADII.map((ring) => (
                <View
                  key={ring.speed}
                  style={[
                    styles.ring,
                    {
                      width: ring.radius * 2,
                      height: ring.radius * 2,
                      borderRadius: ring.radius,
                      marginLeft: -ring.radius,
                      marginTop: -ring.radius,
                    },
                  ]}
                />
              ))}

              {/* Cardinal labels */}
              {CARDINAL_DIRECTIONS.map((dir) => {
                const a = (CARDINAL_ANGLES[dir] * Math.PI) / 180;
                const lx = Math.sin(a) * (COMPASS_RADIUS + 16);
                const ly = -Math.cos(a) * (COMPASS_RADIUS + 16);
                return (
                  <Text
                    key={dir}
                    style={[
                      styles.compassLabel,
                      {
                        left: '50%',
                        top: '50%',
                        transform: [{ translateX: lx - 8 }, { translateY: ly - 8 }],
                      },
                    ]}
                  >
                    {dir}
                  </Text>
                );
              })}

              {/* Arrow indicator */}
              {windSpeed > 0 && (
                <View
                  style={[
                    styles.arrowDot,
                    {
                      left: '50%',
                      top: '50%',
                      transform: [{ translateX: arrowX - 8 }, { translateY: arrowY - 8 }],
                    },
                  ]}
                />
              )}

              {/* Center dot */}
              <View style={styles.centerDot} />
            </View>
          </View>
        )}
      </View>

      {/* Submit */}
      <Pressable
        style={[styles.submitButton, mutation.isPending && styles.submitDisabled]}
        onPress={handleSubmit}
        disabled={mutation.isPending}
        accessibilityRole="button"
        accessibilityLabel="Submit condition report"
      >
        <Text style={styles.submitText}>{mutation.isPending ? 'Submitting...' : 'Submit'}</Text>
      </Pressable>

      {mutation.isError && (
        <Text style={styles.errorText}>Failed to submit. Please try again.</Text>
      )}
    </View>
  );
}

/** Accessible alternative wind input using chips + slider */
function AccessibleWindInput({
  speed,
  angle,
  onSpeedChange,
  onAngleChange,
}: {
  speed: number;
  angle: number;
  onSpeedChange: (s: number) => void;
  onAngleChange: (a: number) => void;
}) {
  return (
    <View style={styles.accessibleWind}>
      <View style={styles.accessibleRow}>
        <Text style={styles.accessibleLabel}>Speed (m/s):</Text>
        <View style={styles.chipRow}>
          {SPEED_STEPS.map((s) => (
            <Pressable
              key={s}
              style={[styles.chip, speed === s && styles.chipActive]}
              onPress={() => onSpeedChange(s)}
              accessibilityRole="button"
              accessibilityState={{ selected: speed === s }}
            >
              <Text style={[styles.chipText, speed === s && styles.chipTextActive]}>{s}</Text>
            </Pressable>
          ))}
        </View>
      </View>
      <View style={styles.accessibleRow}>
        <Text style={styles.accessibleLabel}>Direction:</Text>
        <View style={styles.chipRow}>
          {CARDINAL_DIRECTIONS.map((d) => (
            <Pressable
              key={d}
              style={[styles.chip, angle === CARDINAL_ANGLES[d] && styles.chipActive]}
              onPress={() => onAngleChange(CARDINAL_ANGLES[d])}
              accessibilityRole="button"
              accessibilityState={{ selected: angle === CARDINAL_ANGLES[d] }}
            >
              <Text style={[styles.chipText, angle === CARDINAL_ANGLES[d] && styles.chipTextActive]}>{d}</Text>
            </Pressable>
          ))}
        </View>
        <Text style={styles.accessibleAngle}>{getCardinalLabel(angle)} {angle}°</Text>
        <Slider
          style={styles.slider}
          minimumValue={0}
          maximumValue={355}
          step={5}
          value={angle}
          onValueChange={onAngleChange}
          minimumTrackTintColor="#0284C7"
          maximumTrackTintColor="#E2E8F0"
          thumbTintColor="#0284C7"
          accessibilityLabel="Wind direction in degrees"
          accessibilityValue={{ min: 0, max: 355, now: angle }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  field: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  value: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0284C7',
    textAlign: 'center',
    marginBottom: 4,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  sliderLabel: {
    fontSize: 11,
    color: '#999',
  },
  windHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  toggleLink: {
    fontSize: 13,
    color: '#0284C7',
  },
  windSummary: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  compassWrapper: {
    alignItems: 'center',
  },
  compass: {
    width: (COMPASS_RADIUS + 24) * 2,
    height: (COMPASS_RADIUS + 24) * 2,
    position: 'relative',
  },
  ring: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: 'transparent',
  },
  compassLabel: {
    position: 'absolute',
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    width: 16,
    textAlign: 'center',
  },
  arrowDot: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#0284C7',
  },
  centerDot: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#999',
    marginLeft: -4,
    marginTop: -4,
  },
  accessibleWind: {
    gap: 12,
  },
  accessibleRow: {
    gap: 6,
  },
  accessibleLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#555',
  },
  accessibleAngle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0284C7',
    textAlign: 'center',
    marginTop: 6,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  chipActive: {
    backgroundColor: '#0284C7',
    borderColor: '#0284C7',
  },
  chipText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#555',
  },
  chipTextActive: {
    color: '#fff',
  },
  submitButton: {
    backgroundColor: '#0284C7',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 4,
  },
  submitDisabled: {
    opacity: 0.6,
  },
  submitText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  errorText: {
    color: '#d32f2f',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 8,
  },
  successContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  successIcon: {
    fontSize: 48,
    color: '#10B981',
    marginBottom: 8,
  },
  successText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#10B981',
  },
});
