import { useEffect, useRef, useContext } from 'react';
import { useChatContext } from '../../context/ChatContext';

const renderMarkdown = (text) => {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code>$1</code>')
    .replace(/•\s(.+)/g, '<li>$1</li>')
    .replace(/(<li>[\s\S]*?<\/li>)(\s*(?!<li>))/g, '<ul>$1</ul>$2')
    .replace(/<\/ul>\s*<ul>/g, '')
    .replace(/\n/g, '<br/>');
};

const formatTime = (date) => {
  return new Date(date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
};

// Clarification bubble — shows product options as clickable buttons
const ClarifyBubble = ({ content, timestamp }) => {
  const { addToCartDirect } = useChatContext();
  const { message, products, quantity } = content;

  return (
    <div className="chatbot-bubble chatbot-bubble--clarify">
      <div
        className="chatbot-bubble-text"
        dangerouslySetInnerHTML={{ __html: renderMarkdown(message) }}
      />
      <div className="chatbot-clarify-options">
        {products.map((p) => (
          <button
            key={p._id}
            className="chatbot-clarify-btn"
            onClick={() => addToCartDirect(p, quantity)}
          >
            <span className="chatbot-clarify-name">{p.name}</span>
            {p.variety && <span className="chatbot-clarify-variety">{p.variety}</span>}
            <span className="chatbot-clarify-price">₹{p.price}</span>
          </button>
        ))}
      </div>
      <span className="chatbot-bubble-time">{formatTime(timestamp)}</span>
    </div>
  );
};

const MessageList = ({ messages, isTyping }) => {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  return (
    <div className="chatbot-messages">
      {messages.map((msg) => (
        <div key={msg.id} className={`chatbot-message chatbot-message--${msg.role}`}>
          {msg.role === 'assistant' && (
            <div className="chatbot-avatar">🐄</div>
          )}
          {/* Check if this is a clarification message */}
          {msg.role === 'assistant' && msg.content?.type === 'clarify' ? (
            <ClarifyBubble content={msg.content} timestamp={msg.timestamp} />
          ) : (
            <div className="chatbot-bubble">
              <div
                className="chatbot-bubble-text"
                dangerouslySetInnerHTML={{ __html: renderMarkdown(
                  typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content)
                ) }}
              />
              <span className="chatbot-bubble-time">{formatTime(msg.timestamp)}</span>
            </div>
          )}
        </div>
      ))}

      {isTyping && (
        <div className="chatbot-message chatbot-message--assistant">
          <div className="chatbot-avatar">🐄</div>
          <div className="chatbot-bubble chatbot-bubble--typing">
            <span className="chatbot-dot" />
            <span className="chatbot-dot" />
            <span className="chatbot-dot" />
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
};

export default MessageList;
