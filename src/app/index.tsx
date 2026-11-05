import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from 'expo-speech-recognition';
import { type ComponentRef, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Silence ends a recognition session on Android. These are normal, so we just restart.
const SILENCE_ERRORS = ['no-speech', 'speech-timeout'];

function getEngineName() {
  try {
    return ExpoSpeechRecognitionModule.getDefaultRecognitionService().packageName;
  } catch {
    return 'unknown';
  }
}

export default function CaptionsScreen() {
  const [lines, setLines] = useState<string[]>([]);
  const [interim, setInterim] = useState('');
  const [listening, setListening] = useState(false);
  const [error, setError] = useState('');
  const [engine] = useState(getEngineName);

  const wantsToListen = useRef(false);
  const interimRef = useRef('');
  const scrollRef = useRef<ComponentRef<typeof ScrollView>>(null);

  const showInterim = (text: string) => {
    interimRef.current = text;
    setInterim(text);
  };

  const addLine = (text: string) => {
    const line = text.trim();
    if (line) setLines((current) => [...current, line]);
    showInterim('');
  };

  const startRecognizer = () => {
    ExpoSpeechRecognitionModule.start({
      lang: 'hi-IN',
      interimResults: true,
      continuous: true,
    });
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
    wantsToListen.current = true;
    setListening(true);
    startRecognizer();
  };

  const stop = () => {
    wantsToListen.current = false;
    ExpoSpeechRecognitionModule.stop();
  };

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView
        ref={scrollRef}
        style={styles.captions}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}>
        {lines.map((line, index) => (
          <Text key={index} style={styles.line}>
            {line}
          </Text>
        ))}
        {interim ? <Text style={[styles.line, styles.interim]}>{interim}</Text> : null}
      </ScrollView>

      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Text style={styles.engine}>Engine: {engine}</Text>

      <View style={styles.controls}>
        <Pressable
          accessibilityRole="button"
          onPress={listening ? stop : start}
          style={[styles.button, listening && styles.buttonStop]}>
          <Text style={styles.buttonText}>{listening ? 'Stop' : 'Start'}</Text>
        </Pressable>
      </View>
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
    paddingBottom: 16,
  },
  button: {
    alignItems: 'center',
    backgroundColor: '#1565C0',
    borderRadius: 12,
    paddingVertical: 16,
  },
  buttonStop: {
    backgroundColor: '#B71C1C',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '600',
  },
});
