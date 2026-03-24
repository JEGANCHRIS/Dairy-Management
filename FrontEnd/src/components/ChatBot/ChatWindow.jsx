import { useEffect, useRef, useCallback, useState } from "react";
import { useChatContext } from "../../context/ChatContext";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";
import { speak, stopSpeaking } from "../../utils/speechUtils";

const ChatWindow = ({ onNavigate, onCartAction }) => {
  const {
    isOpen,
    toggleChat,
    messages,
    isTyping,
    sendMessage,
    clearMessages,
    ttsEnabled,
    setTtsEnabled,
    loadHistory,
  } = useChatContext();

  const [windowPosition, setWindowPosition] = useState({});
  const historyLoadedRef = useRef(false);

  useEffect(() => {
    // Update window position based on FAB position
    if (isOpen) {
      const savedPosition = localStorage.getItem("chatbotPosition");
      if (savedPosition) {
        try {
          const { left, top } = JSON.parse(savedPosition);
          // Position window above the FAB
          const newTop = top - 560; // 540px height + 20px gap

          // Check if window would go off screen
          if (newTop < 20) {
            // If too high, position below the FAB
            setWindowPosition({
              bottom: "auto",
              right: "auto",
              top: top + 90 + "px", // FAB height + gap
              left: left + "px",
            });
          } else {
            // Position above
            setWindowPosition({
              bottom: "auto",
              right: "auto",
              top: newTop + "px",
              left: left + "px",
            });
          }
        } catch (e) {
          console.error("Error getting FAB position:", e);
        }
      }
      // If no saved position, keep the CSS default (don't override with inline styles)
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && !historyLoadedRef.current) {
      historyLoadedRef.current = true;
      loadHistory();
    }
  }, [isOpen, loadHistory]);

  useEffect(() => {
    if (!ttsEnabled) return;
    const last = messages[messages.length - 1];
    if (last?.role === "assistant" && last.id !== "welcome" && last.content)
      speak(last.content);
  }, [messages, ttsEnabled]);

  useEffect(() => {
    if (!isOpen) stopSpeaking();
  }, [isOpen]);

  const handleSend = useCallback(
    async (text) => {
      const reply = await sendMessage(text);
      if (ttsEnabled && reply) speak(reply);
    },
    [sendMessage, ttsEnabled],
  );

  const handleVoiceCommand = useCallback(
    async (command) => {
      if (command.action === "clearChat") {
        clearMessages();
      } else if (command.action === "navigate" && onNavigate) {
        onNavigate(command.path);
      } else if (command.action === "cart" && onCartAction) {
        await onCartAction(command);
      }
    },
    [clearMessages, onNavigate, onCartAction],
  );

  if (!isOpen) return null;

  return (
    <div
      className="chatbot-window"
      role="dialog"
      aria-label="Dairy Assistant Chat"
      style={Object.keys(windowPosition).length > 0 ? windowPosition : {}}
    >
      <div className="chatbot-header">
        <div className="chatbot-header-info">
          <span className="chatbot-header-icon">🐄</span>
          <div>
            <div className="chatbot-header-title">Dairy Assistant</div>
            <div className="chatbot-header-status">
              {isTyping ? "Typing..." : "Online"}
            </div>
          </div>
        </div>
        <div className="chatbot-header-actions">
          <button
            className={`chatbot-tts-btn ${ttsEnabled ? "chatbot-tts-btn--active" : ""}`}
            onClick={() => {
              setTtsEnabled((v) => !v);
              if (ttsEnabled) stopSpeaking();
            }}
            title={
              ttsEnabled ? "Disable voice responses" : "Enable voice responses"
            }
          >
            🔊
          </button>
          <button
            className="chatbot-clear-btn"
            onClick={clearMessages}
            title="Clear chat"
          >
            🗑️
          </button>
          <button
            className="chatbot-close-btn"
            onClick={toggleChat}
            title="Close"
          >
            ✕
          </button>
        </div>
      </div>

      <MessageList messages={messages} isTyping={isTyping} />

      <div className="chatbot-footer">
        <MessageInput
          onSend={handleSend}
          onVoiceCommand={handleVoiceCommand}
          disabled={isTyping}
        />
      </div>
    </div>
  );
};

export default ChatWindow;
