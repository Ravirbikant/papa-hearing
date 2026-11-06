import { Alert, Modal, Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { type Corrections, toExportText } from '@/corrections-store';
import { countWordsChanged, findFixes, isLearned, TIMES_BEFORE_LEARNING } from '@/learn-fixes';

type Props = {
  corrections: Corrections;
  onClear: () => void;
  onClose: () => void;
};

export function FixesPanel({ corrections, onClear, onClose }: Props) {
  const { edits, linesSeen } = corrections;
  const fixes = findFixes(edits);
  const editedPercent = linesSeen ? Math.round((edits.length / linesSeen) * 100) : 0;

  const exportAll = () => {
    Share.share({ message: toExportText(corrections) }).catch((e) =>
      Alert.alert('Could not export', String(e)),
    );
  };

  const confirmClear = () => {
    Alert.alert(
      'Clear everything?',
      'This deletes all saved edits and learned fixes on this phone. Export first if you need them.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear', style: 'destructive', onPress: onClear },
      ],
    );
  };

  return (
    <Modal animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.screen}>
        <Text style={styles.title}>Fixes</Text>
        <Text style={styles.stats}>
          Lines edited: {edits.length} of {linesSeen} ({editedPercent}%){'\n'}
          Words changed: {countWordsChanged(edits)}
        </Text>

        <ScrollView style={styles.list}>
          {fixes.length === 0 ? (
            <Text style={styles.empty}>
              No fixes yet. Tap a caption to correct it. After {TIMES_BEFORE_LEARNING} identical
              fixes, the app applies that fix by itself.
            </Text>
          ) : null}
          {fixes.map((fix) => (
            <View key={`${fix.from}\n${fix.to}`} style={styles.fix}>
              <Text style={styles.fixWords}>
                {fix.from} → {fix.to}
              </Text>
              <Text style={styles.fixStatus}>
                {isLearned(fix, fixes)
                  ? `Learned (${fix.count} times)`
                  : `Seen ${fix.count} of ${TIMES_BEFORE_LEARNING} times`}
              </Text>
            </View>
          ))}
        </ScrollView>

        <View style={styles.buttons}>
          <Pressable
            accessibilityRole="button"
            onPress={exportAll}
            style={[styles.button, styles.export]}>
            <Text style={styles.buttonText}>Export</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={confirmClear}
            style={[styles.button, styles.clear]}>
            <Text style={styles.buttonText}>Clear</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={onClose}
            style={[styles.button, styles.close]}>
            <Text style={styles.buttonText}>Close</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: '#000000',
    flex: 1,
    paddingHorizontal: 16,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 16,
  },
  stats: {
    color: '#BDBDBD',
    fontSize: 18,
    lineHeight: 26,
    marginBottom: 16,
  },
  list: {
    flex: 1,
  },
  empty: {
    color: '#A0A0A0',
    fontSize: 18,
    lineHeight: 26,
  },
  fix: {
    borderBottomColor: '#333333',
    borderBottomWidth: 1,
    paddingVertical: 10,
  },
  fixWords: {
    color: '#FFFFFF',
    fontSize: 20,
  },
  fixStatus: {
    color: '#A0A0A0',
    fontSize: 14,
    marginTop: 2,
  },
  buttons: {
    flexDirection: 'row',
    gap: 12,
    paddingBottom: 16,
    paddingTop: 12,
  },
  button: {
    alignItems: 'center',
    borderRadius: 12,
    flex: 1,
    paddingVertical: 16,
  },
  export: {
    backgroundColor: '#1565C0',
  },
  clear: {
    backgroundColor: '#B71C1C',
  },
  close: {
    backgroundColor: '#424242',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '600',
  },
});
