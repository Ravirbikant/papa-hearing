// The recognizer writes everything in Devanagari, so English words arrive as "कार".
// This list swaps them back to English.
//
// Only add a word if it has no Hindi meaning of its own. Words that are also Hindi stay in Hindi,
// so these are left out on purpose: बस, पास, सर, लो, लेट, बिल, डोर, कोट, मेन, सेल, पैन, गुड, फुल, नो.
const ENGLISH_WORDS: Record<string, string> = {
  // Travel
  कार: 'car',
  बाइक: 'bike',
  ट्रक: 'truck',
  ट्रेन: 'train',
  टैक्सी: 'taxi',
  ड्राइवर: 'driver',
  टिकट: 'ticket',
  स्टेशन: 'station',
  फ्लाइट: 'flight',
  एयरपोर्ट: 'airport',
  रोड: 'road',
  सिग्नल: 'signal',
  पेट्रोल: 'petrol',
  डीजल: 'diesel',
  सीट: 'seat',

  // Phone and internet
  फोन: 'phone',
  मोबाइल: 'mobile',
  चार्जर: 'charger',
  चार्ज: 'charge',
  बैटरी: 'battery',
  रिचार्ज: 'recharge',
  नेटवर्क: 'network',
  इंटरनेट: 'internet',
  ऑनलाइन: 'online',
  ऑफलाइन: 'offline',
  वाईफाई: 'Wi-Fi',
  पासवर्ड: 'password',
  लिंक: 'link',
  ऐप: 'app',
  मैसेज: 'message',
  कॉल: 'call',
  वीडियो: 'video',
  फोटो: 'photo',
  नंबर: 'number',
  गूगल: 'Google',
  व्हाट्सएप: 'WhatsApp',
  यूट्यूब: 'YouTube',
  फेसबुक: 'Facebook',
  कंप्यूटर: 'computer',
  लैपटॉप: 'laptop',

  // Home
  टीवी: 'TV',
  रिमोट: 'remote',
  चैनल: 'channel',
  न्यूज: 'news',
  फ्रिज: 'fridge',
  एसी: 'AC',
  गैस: 'gas',
  टॉर्च: 'torch',
  लाइट: 'light',
  गेट: 'gate',
  रूम: 'room',
  बेड: 'bed',
  किचन: 'kitchen',
  बाथरूम: 'bathroom',
  टॉयलेट: 'toilet',
  टेबल: 'table',
  चेयर: 'chair',
  कप: 'cup',
  प्लेट: 'plate',
  ग्लास: 'glass',
  जूस: 'juice',
  शर्ट: 'shirt',
  पैंट: 'pant',
  टाई: 'tie',
  बैग: 'bag',

  // Health
  डॉक्टर: 'doctor',
  डाक्टर: 'doctor',
  हॉस्पिटल: 'hospital',
  क्लिनिक: 'clinic',
  नर्स: 'nurse',
  मेडिकल: 'medical',
  टैबलेट: 'tablet',
  इंजेक्शन: 'injection',
  ऑपरेशन: 'operation',
  रिपोर्ट: 'report',
  टेस्ट: 'test',
  ब्लड: 'blood',
  प्रेशर: 'pressure',
  शुगर: 'sugar',

  // School and work
  स्कूल: 'school',
  कॉलेज: 'college',
  क्लास: 'class',
  टीचर: 'teacher',
  स्टूडेंट: 'student',
  एग्जाम: 'exam',
  रिजल्ट: 'result',
  पेपर: 'paper',
  पेन: 'pen',
  बुक: 'book',
  ऑफिस: 'office',
  मीटिंग: 'meeting',
  बॉस: 'boss',
  जॉब: 'job',
  सैलरी: 'salary',
  मैडम: 'madam',

  // Money and shopping
  बैंक: 'bank',
  एटीएम: 'ATM',
  कार्ड: 'card',
  मार्केट: 'market',
  शॉप: 'shop',
  शॉपिंग: 'shopping',
  रेट: 'rate',
  फ्री: 'free',
  होटल: 'hotel',
  रेस्टोरेंट: 'restaurant',
  पार्क: 'park',

  // Sport
  क्रिकेट: 'cricket',
  मैच: 'match',
  टीम: 'team',
  गेम: 'game',
  बॉल: 'ball',

  // Everyday talk
  टाइम: 'time',
  मिनट: 'minute',
  सेकंड: 'second',
  डेट: 'date',
  संडे: 'Sunday',
  मंडे: 'Monday',
  ओके: 'OK',
  // The user asked for "hi", even though हाय is also a Hindi exclamation.
  हाय: 'hi',
  हेलो: 'hello',
  हैलो: 'hello',
  हेल्लो: 'hello',
  एड्रेस: 'address',
  ऐड्रेस: 'address',
  आफ्टरनून: 'afternoon',
  इवनिंग: 'evening',
  ईवनिंग: 'evening',
  डोंट: "don't",
  थैंक्स: 'thanks',
  वेलकम: 'welcome',
  सॉरी: 'sorry',
  थैंक्यू: 'thank you',
  प्लीज: 'please',
  बाय: 'bye',
  मॉर्निंग: 'morning',
  नाइट: 'night',
  फैमिली: 'family',
  फ्रेंड: 'friend',
  प्रॉब्लम: 'problem',
  टेंशन: 'tension',
  लाइन: 'line',
  लाइफ: 'life',
  सिंपल: 'simple',
  हैप्पी: 'happy',
  एक्चुअली: 'actually',
  बेसिकली: 'basically',
};

// Groups of words that only count as English together. On their own, गुड and नो stay Hindi.
const ENGLISH_PHRASES: [string, string][] = [
  ['आई डोंट नो', "I don't know"],
  ['गुड मॉर्निंग', 'good morning'],
  ['गुड आफ्टरनून', 'good afternoon'],
  ['गुड इवनिंग', 'good evening'],
  ['गुड ईवनिंग', 'good evening'],
  ['गुड नाइट', 'good night'],
  ['थैंक यू', 'thank you'],
];

const LETTER = '[\\u0900-\\u0963\\u0971-\\u097F\\u200C\\u200D]';

// Any amount of space between the words, and not part of a longer word.
const PHRASE_PATTERNS = ENGLISH_PHRASES.map(
  ([hindi, english]) =>
    [new RegExp(`(?<!${LETTER})${hindi.replace(/ /g, '\\s+')}(?!${LETTER})`, 'g'), english] as const,
);

// The dot under a letter (फ़ोन vs फोन) comes and goes between recognizers, so we ignore it when matching.
const toKey = (word: string) => word.normalize('NFC').replace(/़/g, '');

const LOOKUP = new Map(Object.entries(ENGLISH_WORDS).map(([hindi, english]) => [toKey(hindi), english]));

// A run of Devanagari letters. It stops at spaces, punctuation and the danda (।), so "कार।" still matches.
const DEVANAGARI_WORD = new RegExp(`${LETTER}+`, 'g');

export function showEnglishWords(text: string) {
  const withPhrases = PHRASE_PATTERNS.reduce(
    (current, [pattern, english]) => current.replace(pattern, english),
    text,
  );
  return withPhrases.replace(DEVANAGARI_WORD, (word) => LOOKUP.get(toKey(word)) ?? word);
}
