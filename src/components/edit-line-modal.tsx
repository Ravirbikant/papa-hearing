import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

type Props = {
  text: string;
  onSave: (corrected: string) => void;
  onCancel: () => void;
};

// Captions keep running behind this while the user types.
export function EditLineModal({ text, onSave, onCancel }: Props) {
  const [draft, setDraft] = useState(text);

  return (
    <Modal transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <TextInput
            autoFocus
            multiline
            value={draft}
            onChangeText={setDraft}
            style={styles.input}
          />
          <View style={styles.buttons}>
            <Pressable
              accessibilityRole="button"
              onPress={onCancel}
              style={[styles.button, styles.cancel]}>
              <Text style={styles.buttonText}>Cancel</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={() => onSave(draft)}
              style={[styles.button, styles.save]}>
              <Text style={styles.buttonText}>Save</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    flex: 1,
    padding: 16,
    paddingTop: 64,
  },
  card: {
    backgroundColor: '#212121',
    borderRadius: 12,
    gap: 12,
    padding: 16,
  },
  input: {
    color: '#FFFFFF',
    fontSize: 26,
    maxHeight: 240,
  },
  buttons: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    alignItems: 'center',
    borderRadius: 12,
    flex: 1,
    paddingVertical: 12,
  },
  cancel: {
    backgroundColor: '#424242',
  },
  save: {
    backgroundColor: '#1565C0',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '600',
  },
});
