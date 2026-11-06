import AsyncStorage from '@react-native-async-storage/async-storage';

import { countWordsChanged, type Edit, findFixes } from '@/learn-fixes';

export type Corrections = { edits: Edit[]; linesSeen: number };

export const NO_CORRECTIONS: Corrections = { edits: [], linesSeen: 0 };

const STORAGE_KEY = 'corrections-v1';

export async function loadCorrections(): Promise<Corrections> {
  const saved = await AsyncStorage.getItem(STORAGE_KEY);
  return saved ? JSON.parse(saved) : NO_CORRECTIONS;
}

export function saveCorrections(corrections: Corrections) {
  return AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(corrections));
}

export function toExportText({ edits, linesSeen }: Corrections) {
  return JSON.stringify(
    {
      exportedAt: new Date().toISOString(),
      linesSeen,
      linesEdited: edits.length,
      wordsChanged: countWordsChanged(edits),
      fixes: findFixes(edits),
      edits,
    },
    null,
    2,
  );
}
