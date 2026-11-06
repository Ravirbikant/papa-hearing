// Learns word fixes from the user's edits, with no AI: compare what was shown with what the user
// typed, and once the same change has been made enough times, apply it to future captions.

export type Edit = {
  id: string;
  raw: string; // What the recognizer wrote.
  shown: string; // What we displayed, which is what the user was correcting.
  corrected: string;
  at: string;
};

export type Fix = { from: string; to: string; count: number };

export const TIMES_BEFORE_LEARNING = 2;

// Everything except spaces and punctuation counts as part of a word.
const WORD_CHAR = '[^\\s,.?!।॥;:"()]';
const WORD = new RegExp(`${WORD_CHAR}+`, 'g');

const toWords = (text: string) => text.match(WORD) ?? [];

type Change = { removed: string[]; added: string[] };

// Finds the groups of words that differ, using the longest common subsequence of the two lines.
function findChanges(before: string[], after: string[]): Change[] {
  const common = Array.from({ length: before.length + 1 }, () =>
    new Array<number>(after.length + 1).fill(0),
  );
  for (let b = before.length - 1; b >= 0; b--) {
    for (let a = after.length - 1; a >= 0; a--) {
      common[b][a] =
        before[b] === after[a]
          ? common[b + 1][a + 1] + 1
          : Math.max(common[b + 1][a], common[b][a + 1]);
    }
  }

  const changes: Change[] = [];
  let current: Change | null = null;
  let b = 0;
  let a = 0;
  while (b < before.length || a < after.length) {
    if (b < before.length && a < after.length && before[b] === after[a]) {
      current = null;
      b++;
      a++;
      continue;
    }
    if (!current) {
      current = { removed: [], added: [] };
      changes.push(current);
    }
    if (a >= after.length || (b < before.length && common[b + 1][a] >= common[b][a + 1])) {
      current.removed.push(before[b++]);
    } else {
      current.added.push(after[a++]);
    }
  }
  return changes;
}

const changesIn = (edit: Edit) => findChanges(toWords(edit.shown), toWords(edit.corrected));

export function countWordsChanged(edits: Edit[]) {
  return edits
    .flatMap(changesIn)
    .reduce((total, { removed, added }) => total + Math.max(removed.length, added.length), 0);
}

// Every replacement the user has made, most repeated first. Added or deleted words don't count,
// because there is nothing to swap them with.
export function findFixes(edits: Edit[]): Fix[] {
  const fixes = new Map<string, Fix>();
  for (const { removed, added } of edits.flatMap(changesIn)) {
    if (!removed.length || !added.length) continue;
    const from = removed.join(' ');
    const to = added.join(' ');
    const key = `${from}\n${to}`;
    const fix = fixes.get(key) ?? { from, to, count: 0 };
    fix.count++;
    fixes.set(key, fix);
  }
  return [...fixes.values()].sort((one, other) => other.count - one.count);
}

export function isLearned(fix: Fix, fixes: Fix[]) {
  // If the same words were fixed in two different ways, only the more frequent fix applies.
  const best = fixes.find(({ from }) => from === fix.from);
  return fix.count >= TIMES_BEFORE_LEARNING && best?.to === fix.to;
}

export function buildFixer(fixes: Fix[]) {
  const learned = fixes.filter((fix) => isLearned(fix, fixes));
  if (!learned.length) return (text: string) => text;

  const swaps = new Map(learned.map(({ from, to }) => [from, to]));
  // Longest first, so that "रहत मीना" wins over a separate fix for "रहत".
  const alternatives = [...swaps.keys()]
    .sort((one, other) => other.length - one.length)
    .map((from) => from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/ /g, '\\s+'));
  const pattern = new RegExp(
    `(?<!${WORD_CHAR})(?:${alternatives.join('|')})(?!${WORD_CHAR})`,
    'g',
  );

  return (text: string) =>
    text.replace(pattern, (match) => swaps.get(match.split(/\s+/).join(' ')) ?? match);
}
