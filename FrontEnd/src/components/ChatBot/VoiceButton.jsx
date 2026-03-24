import { useState, useRef, useEffect } from 'react';
import { createSpeechRecognition, isSpeechRecognitionSupported, detectVoiceCommand, SUPPORTED_LANGUAGES } from '../../utils/speechUtils';

const VoiceButton = ({ onTranscript, onCommand }) => {
  const [isListening, setIsListening] = useState(false);
  const [supported] = useState(isSpeechRecognitionSupported());
  const [selectedLang, setSelectedLang] = useState(() => localStorage.getItem('voiceLang') || 'en-IN');
  const [showLangPicker, setShowLangPicker] = useState(false);
  const recognitionRef = useRef(null);
  const collectedTextRef = useRef('');
  const isListeningRef = useRef(false);

  // Always keep latest callbacks in refs — prevents stale closure bug
  const onTranscriptRef = useRef(onTranscript);
  const onCommandRef = useRef(onCommand);
  useEffect(() => { onTranscriptRef.current = onTranscript; }, [onTranscript]);
  useEffect(() => { onCommandRef.current = onCommand; }, [onCommand]);

  useEffect(() => {
    return () => { recognitionRef.current?.abort(); };
  }, []);

  const handleLangChange = (code) => {
    setSelectedLang(code);
    localStorage.setItem('voiceLang', code);
    setShowLangPicker(false);
  };

  const startListening = () => {
    if (isListeningRef.current) return;
    const recognition = createSpeechRecognition(selectedLang);
    if (!recognition) return;

    recognitionRef.current = recognition;
    collectedTextRef.current = '';
    isListeningRef.current = true;
    setIsListening(true);

    recognition.onresult = (e) => {
      let finalText = '';
      let interimText = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) {
          finalText += e.results[i][0].transcript;
        } else {
          interimText += e.results[i][0].transcript;
        }
      }
      // Accumulate finals; keep latest interim as fallback
      if (finalText) {
        collectedTextRef.current += finalText;
      } else if (interimText && !collectedTextRef.current) {
        collectedTextRef.current = interimText;
      }
    };

    recognition.onerror = (e) => {
      console.warn('[Voice] Recognition error:', e.error);
      // Do NOT reset collectedText — let onend handle sending what was collected
      isListeningRef.current = false;
      setIsListening(false);
    };

    // onend fires after both natural end AND manual stop() — this is the single exit point
    recognition.onend = () => {
      isListeningRef.current = false;
      setIsListening(false);
      const transcript = collectedTextRef.current.trim();
      collectedTextRef.current = '';
      console.log('[Voice] onend — transcript:', transcript || '(empty)');
      if (transcript) {
        const command = detectVoiceCommand(transcript);
        if (command) {
          onCommandRef.current?.(command, transcript);
        } else {
          onTranscriptRef.current?.(transcript);
        }
      }
    };

    try {
      recognition.start();
      console.log('[Voice] Started, lang:', selectedLang);
    } catch (e) {
      console.error('[Voice] Start failed:', e);
      isListeningRef.current = false;
      setIsListening(false);
    }
  };

  const stopListening = () => {
    console.log('[Voice] Stop clicked');
    // stop() triggers onend which handles sending the transcript
    recognitionRef.current?.stop();
  };

  if (!supported) {
    return (
      <button className="chatbot-voice-btn chatbot-voice-btn--unsupported" title="Voice not supported in this browser" disabled>
        🎤
      </button>
    );
  }

  const currentLang = SUPPORTED_LANGUAGES.find(l => l.code === selectedLang);

  return (
    <div className="chatbot-voice-wrapper">
      {showLangPicker && (
        <div className="chatbot-lang-picker">
          {SUPPORTED_LANGUAGES.map(lang => (
            <button
              key={lang.code}
              className={`chatbot-lang-option ${selectedLang === lang.code ? 'chatbot-lang-option--active' : ''}`}
              onClick={() => handleLangChange(lang.code)}
            >
              {lang.label}
            </button>
          ))}
        </div>
      )}
      <button
        className="chatbot-lang-btn"
        onClick={() => setShowLangPicker(v => !v)}
        title="Change voice language"
        disabled={isListening}
      >
        🌐
      </button>
      <button
        className={`chatbot-voice-btn ${isListening ? 'chatbot-voice-btn--active' : ''}`}
        onClick={isListening ? stopListening : startListening}
        title={isListening ? `Listening in ${currentLang?.label} — click to stop` : `Speak in ${currentLang?.label}`}
      >
        {isListening ? (
          <span className="chatbot-voice-pulse">
            <span /><span /><span />
          </span>
        ) : '🎤'}
      </button>
    </div>
  );
};

export default VoiceButton;
