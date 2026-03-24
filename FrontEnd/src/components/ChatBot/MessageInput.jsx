import { useState, useRef } from 'react';
import VoiceButton from './VoiceButton';

const MessageInput = ({ onSend, onVoiceCommand, disabled }) => {
  const [text, setText] = useState('');
  const inputRef = useRef(null);

  const handleSend = () => {
    if (!text.trim() || disabled) return;
    onSend(text.trim());
    setText('');
    inputRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleVoiceTranscript = (transcript) => {
    const trimmed = transcript.trim();
    if (trimmed) onSend(trimmed);
  };

  const handleVoiceCommand = (command, rawText) => {
    if (command.action === 'query') {
      onSend(command.message);
    } else if (command.action === 'cart' || command.action === 'clearChat' || command.action === 'navigate') {
      onVoiceCommand?.(command);
    } else {
      setText(rawText);
    }
  };

  return (
    <div className="chatbot-input-row">
      <input
        ref={inputRef}
        className="chatbot-input"
        type="text"
        placeholder="Type or 🎤 say 'add 2 medium milk'..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        maxLength={500}
      />
      <VoiceButton onTranscript={handleVoiceTranscript} onCommand={handleVoiceCommand} disabled={false} />
      <button className="chatbot-send-btn" onClick={handleSend} disabled={disabled || !text.trim()} title="Send">➤</button>
    </div>
  );
};

export default MessageInput;
