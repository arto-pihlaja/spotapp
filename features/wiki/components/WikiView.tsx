import { StyleSheet, View, Text, ActivityIndicator, Pressable } from 'react-native';
import Markdown from 'react-native-markdown-display';
import { useWiki } from '../hooks/useWiki';
import { useAuthStore } from '@/stores/useAuthStore';

interface WikiViewProps {
  spotId: string | null;
  onEdit?: () => void;
}

const EMPTY_PLACEHOLDER = `## Parking
_No info yet_

## Hazards
_No info yet_

## Conditions
_No info yet_

## Etiquette
_No info yet_

## Notes
_No info yet_`;

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function WikiView({ spotId, onEdit }: WikiViewProps) {
  const { data: wiki, isLoading } = useWiki(spotId);
  const isAuthenticated = useAuthStore((s) => !!s.accessToken);

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="small" color="#007AFF" />
      </View>
    );
  }

  if (!wiki || !wiki.content) {
    return (
      <View>
        <Text style={styles.emptyText}>No wiki content yet</Text>
        {isAuthenticated && onEdit && (
          <Pressable onPress={onEdit} style={styles.editButton}>
            <Text style={styles.editText}>Edit Wiki</Text>
          </Pressable>
        )}
        <View style={styles.placeholder}>
          <Markdown style={markdownStyles}>{EMPTY_PLACEHOLDER}</Markdown>
        </View>
      </View>
    );
  }

  return (
    <View>
      {isAuthenticated && onEdit && (
        <Pressable onPress={onEdit} style={styles.editButton}>
          <Text style={styles.editText}>Edit Wiki</Text>
        </Pressable>
      )}
      <Markdown style={markdownStyles}>{wiki.content}</Markdown>
      {wiki.updatedAt && (
        <Text style={styles.meta}>
          Last updated {formatDate(wiki.updatedAt)}
          {wiki.updatedBy ? ` by ${wiki.updatedBy}` : ''}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  centered: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  editButton: {
    alignSelf: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#007AFF',
    marginBottom: 8,
  },
  editText: {
    fontSize: 13,
    color: '#fff',
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
    marginBottom: 12,
  },
  placeholder: {
    opacity: 0.5,
  },
  meta: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
  },
});

const markdownStyles = {
  heading2: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#333',
    marginTop: 12,
    marginBottom: 4,
  },
  body: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
  },
  em: {
    color: '#999',
  },
};
