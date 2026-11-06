import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from 'expo-speech-recognition';
import { type ComponentRef, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EditLineModal } from '@/components/edit-line-modal';
import { FixesPanel } from '@/components/fixes-panel';
import {
  type Corrections,
  loadCorrections,
  NO_CORRECTIONS,
  saveCorrections,
} from '@/corrections-store';
import { showEnglishWords } from '@/english-words';
import { buildFixer, findFixes } from '@/learn-fixes';

type Line = { id: string; raw: string; corrected?: string };

const LANGUAGE = 'hi-IN';

// Silence ends a recognition session on Android. These are normal, so we just restart.
const SILENCE_ERRORS = ['no-speech', 'speech-timeout'];

export default function CaptionsScreen() {
  const [lines, setLines] = useState<Line[]>([]);
  const [interim, setInterim] = useState('');
  const [listening, setListening] = useState(false);
  const [error, setError] = useState('');

  const [onDevice, setOnDevice] = useState(false);

  const [corrections, setCorrections] = useState<Corrections>(NO_CORRECTIONS);
  const [editingLine, setEditingLine] = useState<Line | null>(null);
  const [showFixes, setShowFixes] = useState(false);

  const correctionsLoaded = useRef(false);
  const nextLineNumber = useRef(0);
  const useOnDevice = useRef(false);
  const downloadRequested = useRef(false);
  const wantsToListen = useRef(false);
  const interimRef = useRef('');
  const scrollRef = useRef<ComponentRef<typeof ScrollView>>(null);

  useEffect(() => {
    loadCorrections()
      .then((saved) => {
        correctionsLoaded.current = true;
        setCorrections(saved);
      })
      .catch((e) => setError(`Could not load saved fixes: ${String(e)}`));
  }, []);

  useEffect(() => {
    if (!correctionsLoaded.current) return;
    saveCorrections(corrections).catch((e) => setError(`Could not save fixes: ${String(e)}`));
  }, [corrections]);

  const applyFixes = useMemo(() => buildFixer(findFixes(corrections.edits)), [corrections.edits]);
  const toShownText = (raw: string) => applyFixes(showEnglishWords(raw));

  const showInterim = (text: string) => {
    interimRef.current = text;
    setInterim(text);
  };

  const addLine = (text: string) => {
    const raw = text.trim();
    if (raw) {
      const id = `${Date.now()}-${nextLineNumber.current++}`;
      setLines((current) => [...current, { id, raw }]);
      setCorrections((current) => ({ ...current, linesSeen: current.linesSeen + 1 }));
    }
    showInterim('');
  };

  const saveEdit = (line: Line, text: string) => {
    setEditingLine(null);
    const corrected = text.trim();
    if (!corrected) return;

    setCorrections((current) => {
      const existing = current.edits.find(({ id }) => id === line.id);
      const others = current.edits.filter(({ id }) => id !== line.id);
      // Keep the text from the first edit, so editing a line twice doesn't count as two fixes.
      const shown = existing?.shown ?? toShownText(line.raw);
      if (corrected === shown) return { ...current, edits: others };
      const edit = { id: line.id, raw: line.raw, shown, corrected, at: new Date().toISOString() };
      return { ...current, edits: [...others, edit] };
    });
    setLines((current) =>
      current.map((other) => (other.id === line.id ? { ...other, corrected } : other)),
    );
  };

  const clearCorrections = () => {
    setCorrections(NO_CORRECTIONS);
    setShowFixes(false);
  };

  const startRecognizer = () => {
    ExpoSpeechRecognitionModule.start({
      lang: LANGUAGE,
      interimResults: true,
      continuous: true,
      // Punctuation is only known to work on Android with on-device recognition.
      addsPunctuation: true,
      requiresOnDeviceRecognition: useOnDevice.current,
    });
  };

  const hasHindiModel = async () => {
    try {
      const { installedLocales } = await ExpoSpeechRecognitionModule.getSupportedLocales({});
      return installedLocales.includes(LANGUAGE);
    } catch {
      return false;
    }
  };

  // Asks only once per app launch, and doesn't wait: captions run online until the model arrives.
  const requestHindiModel = () => {
    if (downloadRequested.current) return;
    downloadRequested.current = true;
    ExpoSpeechRecognitionModule.androidTriggerOfflineModelDownload({ locale: LANGUAGE }).catch(
      (e) => setError(`Could not download the Hindi model: ${String(e)}`),
    );
  };

  useSpeechRecognitionEvent('result', (event) => {
    const text = event.results[0]?.transcript ?? '';
    if (event.isFinal) {
      addLine(text);
    } else {
      showInterim(text);
    }
  });

  useSpeechRecognitionEvent('error', (event) => {
    if (SILENCE_ERRORS.includes(event.error)) return;
    // The on-device recognizer reports this when we stop it, so it isn't a real problem.
    if (event.error === 'client' && !wantsToListen.current) return;
    wantsToListen.current = false;
    setError(`${event.error}: ${event.message}`);
  });

  useSpeechRecognitionEvent('end', () => {
    // Keep any words still on screen, so that stopping or restarting doesn't drop them.
    addLine(interimRef.current);
    if (wantsToListen.current) {
      startRecognizer();
    } else {
      setListening(false);
    }
  });

  const start = async () => {
    setError('');
    const permission = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
    if (!permission.granted) {
      setError('Microphone permission is needed to show captions.');
      return;
    }
    const hasModel = await hasHindiModel();
    useOnDevice.current = hasModel;
    setOnDevice(hasModel);
    if (!hasModel) requestHindiModel();
    wantsToListen.current = true;
    setListening(true);
    startRecognizer();
  };

  const stop = () => {
    wantsToListen.current = false;
    ExpoSpeechRecognitionModule.stop();
  };

  const clear = () => {
    setLines([]);
    showInterim('');
  };

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView
        ref={scrollRef}
        style={styles.captions}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}>
        {lines.map((line) => (
          <Text key={line.id} style={styles.line} onPress={() => setEditingLine(line)}>
            {line.corrected ?? toShownText(line.raw)}
          </Text>
        ))}
        {interim ? <Text style={[styles.line, styles.interim]}>{toShownText(interim)}</Text> : null}
      </ScrollView>

      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Text style={styles.engine}>
        Engine: {onDevice ? 'on-device' : 'online (Hindi model not installed)'}
      </Text>

      <View style={styles.controls}>
        <Pressable
          accessibilityRole="button"
          onPress={listening ? stop : start}
          style={[styles.button, listening && styles.buttonStop]}>
          <Text style={styles.buttonText}>{listening ? 'Stop' : 'Start'}</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={clear}
          style={[styles.button, styles.buttonClear]}>
          <Text style={styles.buttonText}>Clear</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => setShowFixes(true)}
          style={[styles.button, styles.buttonClear]}>
          <Text style={styles.buttonText}>Fixes</Text>
        </Pressable>
      </View>

      {editingLine ? (
        <EditLineModal
          text={editingLine.corrected ?? toShownText(editingLine.raw)}
          onSave={(text) => saveEdit(editingLine, text)}
          onCancel={() => setEditingLine(null)}
        />
      ) : null}
      {showFixes ? (
        <FixesPanel
          corrections={corrections}
          onClear={clearCorrections}
          onClose={() => setShowFixes(false)}
        />
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#000000',
    paddingHorizontal: 16,
  },
  captions: {
    flex: 1,
  },
  line: {
    color: '#FFFFFF',
    fontSize: 30,
    lineHeight: 42,
    marginBottom: 16,
  },
  interim: {
    color: '#A0A0A0',
  },
  error: {
    color: '#FF8A80',
    fontSize: 16,
    marginBottom: 8,
  },
  engine: {
    color: '#808080',
    fontSize: 12,
    marginBottom: 8,
  },
  controls: {
    flexDirection: 'row',
    gap: 12,
    paddingBottom: 16,
  },
  button: {
    alignItems: 'center',
    backgroundColor: '#1565C0',
    borderRadius: 12,
    flex: 1,
    paddingVertical: 16,
  },
  buttonStop: {
    backgroundColor: '#B71C1C',
  },
  buttonClear: {
    backgroundColor: '#424242',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '600',
  },
});
