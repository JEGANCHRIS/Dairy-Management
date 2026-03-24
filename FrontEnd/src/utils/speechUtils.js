export const isSpeechRecognitionSupported = () =>
  'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;

export const isSpeechSynthesisSupported = () =>
  'speechSynthesis' in window;

export const createSpeechRecognition = (lang) => {
  if (!isSpeechRecognitionSupported()) return null;
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = new SpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = true;
  recognition.lang = lang || navigator.language || 'en-IN';
  recognition.maxAlternatives = 1;
  return recognition;
};

export const SUPPORTED_LANGUAGES = [
  { code: 'en-IN', label: 'English (India)' },
  { code: 'en-US', label: 'English (US)' },
  { code: 'hi-IN', label: 'Hindi' },
  { code: 'ta-IN', label: 'Tamil' },
  { code: 'te-IN', label: 'Telugu' },
  { code: 'kn-IN', label: 'Kannada' },
  { code: 'ml-IN', label: 'Malayalam' },
  { code: 'mr-IN', label: 'Marathi' },
  { code: 'bn-IN', label: 'Bengali' },
  { code: 'gu-IN', label: 'Gujarati' },
  { code: 'pa-IN', label: 'Punjabi' },
  { code: 'fr-FR', label: 'Francais' },
  { code: 'de-DE', label: 'Deutsch' },
  { code: 'ar-SA', label: 'Arabic' },
];

// ── Cart voice/text command parser ───────────────────────────────────────────
// Handles: "add 2 organic butter", "add some 2 medium milk to my cart",
//          "remove milk from cart", "add one paneer"
const NUMBER_WORDS = { one:1, two:2, three:3, four:4, five:5, six:6, seven:7, eight:8, nine:9, ten:10 };
const STOP_WORDS   = ['some', 'small', 'quantity', 'please', 'the', 'a', 'an', 'me', 'my', 'of', 'piece', 'pieces', 'unit', 'units', 'item', 'items', 'pack', 'packet'];

export const parseCartCommand = (transcript) => {
  const t = transcript.toLowerCase().trim();

  // Must contain add/put/buy OR remove/delete to be a cart command
  const isAdd    = t.includes('add') || t.includes('put') || t.includes('buy');
  const isRemove = t.includes('remove') || t.includes('delete from cart');

  if (!isAdd && !isRemove) return null;

  // Remove from cart
  if (isRemove) {
    const product = t.replace(/remove|delete|from cart|from my cart|from the cart/g, '').trim();
    return { action: 'remove', productQuery: product || null, quantity: 1 };
  }

  // Add to cart
  if (isAdd) {
    // Remove command words and filler words
    let query = t
      .replace(/add|put|buy|to cart|to my cart|in cart|in my cart|to the cart/g, '')
      .trim();

    // Extract quantity from number words
    let qty = 1;
    for (const [word, num] of Object.entries(NUMBER_WORDS)) {
      const re = new RegExp(`\\b${word}\\b`);
      if (re.test(query)) {
        qty = num;
        query = query.replace(re, '').trim();
        break;
      }
    }

    // Extract quantity from digits
    const digitMatch = query.match(/\b(\d+)\b/);
    if (digitMatch) {
      qty = parseInt(digitMatch[1]);
      query = query.replace(digitMatch[0], '').trim();
    }

    // Remove stop words
    query = query.split(' ').filter(w => w.length > 1 && !STOP_WORDS.includes(w)).join(' ').trim();

    if (query.length > 1) {
      return { action: 'add', productQuery: query, quantity: qty };
    }
  }

  return null;
};

// ── Standard voice commands (chat queries) ────────────────────────────────────
const VOICE_COMMANDS = {
  'show me products':     { action: 'query', message: 'What dairy products do you have available?' },
  'show products':        { action: 'query', message: 'What dairy products do you have available?' },
  'track my order':       { action: 'query', message: 'How can I track my order?' },
  'track order':          { action: 'query', message: 'How can I track my order?' },
  'contact support':      { action: 'query', message: 'How can I contact customer support?' },
  'return policy':        { action: 'query', message: 'What is your return and refund policy?' },
  'tell me about milk':   { action: 'query', message: 'Tell me about your milk products' },
  'milk products':        { action: 'query', message: 'What milk products do you offer?' },
  'tell me about paneer': { action: 'query', message: 'Tell me about your paneer products' },
  'cheese varieties':     { action: 'query', message: 'What cheese varieties do you have?' },
  'delivery time':        { action: 'query', message: 'How long does delivery take?' },
  'clear chat':           { action: 'clearChat', message: null },
  'go to cart':           { action: 'navigate', path: '/cart' },
  'open cart':            { action: 'navigate', path: '/cart' },
  'my orders':            { action: 'navigate', path: '/orders' },
  'go to products':       { action: 'navigate', path: '/products' },
};

export const detectVoiceCommand = (transcript) => {
  const lower = transcript.toLowerCase().trim();

  // Check cart commands first
  const cartCmd = parseCartCommand(lower);
  if (cartCmd) return { action: 'cart', ...cartCmd };

  // Then check standard commands
  for (const [phrase, cmd] of Object.entries(VOICE_COMMANDS)) {
    if (lower.includes(phrase)) return cmd;
  }
  return null;
};

// ── TTS ───────────────────────────────────────────────────────────────────────
let currentUtterance = null;

export const speak = (text, options = {}) => {
  if (!isSpeechSynthesisSupported()) return;
  stopSpeaking();
  const clean = text
    .replace(/\*\*(.*?)\*\*/g, '$1').replace(/\*(.*?)\*/g, '$1')
    .replace(/#{1,6}\s/g, '').replace(/`(.*?)`/g, '$1')
    .replace(/\n+/g, '. ').substring(0, 400);
  currentUtterance = new SpeechSynthesisUtterance(clean);
  currentUtterance.lang   = options.lang || 'en-IN';
  currentUtterance.rate   = options.rate || 0.95;
  currentUtterance.pitch  = options.pitch || 1;
  currentUtterance.volume = options.volume || 1;
  const voices    = window.speechSynthesis.getVoices();
  const preferred = voices.find(v => v.lang.startsWith('en') && v.name.includes('Google'))
    || voices.find(v => v.lang.startsWith('en-IN'))
    || voices.find(v => v.lang.startsWith('en'));
  if (preferred) currentUtterance.voice = preferred;
  if (options.onEnd) currentUtterance.onend = options.onEnd;
  window.speechSynthesis.speak(currentUtterance);
};

export const stopSpeaking = () => {
  if (isSpeechSynthesisSupported()) { window.speechSynthesis.cancel(); currentUtterance = null; }
};

export const isSpeaking = () =>
  isSpeechSynthesisSupported() && window.speechSynthesis.speaking;
