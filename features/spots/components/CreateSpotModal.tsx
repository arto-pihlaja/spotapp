import { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useCreateSpot } from '../hooks/useCreateSpot';

interface CreateSpotModalProps {
  visible: boolean;
  coordinate: { latitude: number; longitude: number } | null;
  onClose: () => void;
}

export function CreateSpotModal({ visible, coordinate, onClose }: CreateSpotModalProps) {
  const [name, setName] = useState('');
  const [validationError, setValidationError] = useState('');
  const { mutate, isPending, error, reset } = useCreateSpot();

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!visible) {
      setName('');
      setValidationError('');
      reset();
    }
  }, [visible, reset]);

  const handleCreate = () => {
    const trimmed = name.trim();
    if (trimmed.length < 2) {
      setValidationError('Name must be at least 2 characters');
      return;
    }
    if (trimmed.length > 100) {
      setValidationError('Name must be at most 100 characters');
      return;
    }
    if (!coordinate) return;

    setValidationError('');
    mutate(
      { name: trimmed, lat: coordinate.latitude, lng: coordinate.longitude },
      { onSuccess: onClose },
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <Text style={styles.title}>Create Spot</Text>

          {coordinate && (
            <Text style={styles.coords}>
              {coordinate.latitude.toFixed(5)}, {coordinate.longitude.toFixed(5)}
            </Text>
          )}

          <TextInput
            style={styles.input}
            placeholder="Spot name"
            value={name}
            onChangeText={(text) => {
              setName(text);
              if (validationError) setValidationError('');
            }}
            maxLength={100}
            autoFocus
          />

          {validationError ? (
            <Text style={styles.error}>{validationError}</Text>
          ) : null}

          {error ? (
            <Text style={styles.error}>{error.message}</Text>
          ) : null}

          <View style={styles.buttons}>
            <Pressable
              style={[styles.button, styles.cancelButton]}
              onPress={onClose}
              disabled={isPending}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>

            <Pressable
              style={[styles.button, styles.createButton, isPending && styles.disabled]}
              onPress={handleCreate}
              disabled={isPending}
            >
              {isPending ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.createText}>Create</Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 24,
    paddingBottom: 36,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  coords: {
    fontSize: 13,
    color: '#666',
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 8,
  },
  error: {
    color: '#dc2626',
    fontSize: 13,
    marginBottom: 8,
  },
  buttons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f3f4f6',
  },
  cancelText: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
  },
  createButton: {
    backgroundColor: '#0284C7',
  },
  createText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  disabled: {
    opacity: 0.6,
  },
});
