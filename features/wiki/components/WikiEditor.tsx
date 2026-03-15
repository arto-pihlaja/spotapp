import { useState } from 'react';
import { StyleSheet, View, Text, TextInput, Pressable, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import Markdown from 'react-native-markdown-display';
import { useUpdateWiki } from '../hooks/useUpdateWiki';

interface WikiEditorProps {
  spotId: string;
  initialContent: string;
  onDone: () => void;
}

export function WikiEditor({ spotId, initialContent, onDone }: WikiEditorProps) {
  const [content, setContent] = useState(initialContent);
  const [previewing, setPreviewing] = useState(false);
  const { mutate, isPending } = useUpdateWiki(spotId);

  const handleSave = () => {
    mutate(content, { onSuccess: onDone });
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={120}
    >
      {/* Toolbar */}
      <View style={styles.toolbar}>
        <Pressable
          onPress={() => setPreviewing(false)}
          style={[styles.tab, !previewing && styles.activeTab]}
        >
          <Text style={[styles.tabText, !previewing && styles.activeTabText]}>Edit</Text>
        </Pressable>
        <Pressable
          onPress={() => setPreviewing(true)}
          style={[styles.tab, previewing && styles.activeTab]}
        >
          <Text style={[styles.tabText, previewing && styles.activeTabText]}>Preview</Text>
        </Pressable>
      </View>

      {/* Content */}
      {previewing ? (
        <View style={styles.preview}>
          <Markdown style={markdownStyles}>{content || '_Nothing to preview_'}</Markdown>
        </View>
      ) : (
        <TextInput
          style={styles.input}
          value={content}
          onChangeText={setContent}
          multiline
          textAlignVertical="top"
          placeholder="Write wiki content in markdown..."
          autoFocus
        />
      )}

      {/* Actions */}
      <View style={styles.actions}>
        <Pressable onPress={onDone} style={styles.cancelButton} disabled={isPending}>
          <Text style={styles.cancelText}>Cancel</Text>
        </Pressable>
        <Pressable onPress={handleSave} style={styles.saveButton} disabled={isPending}>
          {isPending ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.saveText}>Save</Text>
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
  },
  toolbar: {
    flexDirection: 'row',
    marginBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e0e0e0',
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 4,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#007AFF',
  },
  tabText: {
    fontSize: 14,
    color: '#888',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#007AFF',
  },
  input: {
    minHeight: 200,
    fontSize: 14,
    lineHeight: 20,
    color: '#333',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#fafafa',
    fontFamily: 'monospace',
  },
  preview: {
    flex: 1,
    minHeight: 200,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fafafa',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 12,
    flexShrink: 0,
  },
  cancelButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    minWidth: 70,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  saveButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#007AFF',
    minWidth: 70,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
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
