import { useState, useRef, useEffect } from "react";
import "./AIAdminBot.css";
import BotIcon from "../../assets/bot.svg";
import ChartIcon from "../../assets/chart.svg";
import MoneyIcon from "../../assets/money-bag.svg";
import ProductBoxIcon from "../../assets/product-box.svg";
import OrdersIcon from "../../assets/orders.svg";
import SuspiciousIcon from "../../assets/suspicious.svg";
import CheckIcon from "../../assets/check.svg";
import CrossMarkIcon from "../../assets/cross-mark.svg";
import ClockIcon from "../../assets/clock.svg";
import LockIcon from "../../assets/lock-pad.svg";

// Use relative path — goes through Vite proxy to localhost:5000
// This is how ALL other components work in this project
const API = "/api";

const QUICK_COMMANDS = [
  {
    label: (
      <>
        <img src={ChartIcon} alt="Analytics" className="quick-command-icon" />
        Show analytics
      </>
    ),
    cmd: "Show me the current sales analytics and low stock products",
  },
  {
    label: (
      <>
        <img src={MoneyIcon} alt="Prices" className="quick-command-icon" />
        Optimize prices
      </>
    ),
    cmd: "Check all products and show pricing suggestions",
  },
  {
    label: (
      <>
        <img
          src={ProductBoxIcon}
          alt="Restock"
          className="quick-command-icon"
        />
        Restock low items
      </>
    ),
    cmd: "Restock all products with low stock by 50 units",
  },
  {
    label: (
      <>
        <img src={OrdersIcon} alt="Ship" className="quick-command-icon" />
        Ship orders
      </>
    ),
    cmd: "Mark all processing orders as shipped",
  },
  {
    label: (
      <>
        <img src={SuspiciousIcon} alt="Flag" className="quick-command-icon" />
        Flag suspicious orders
      </>
    ),
    cmd: "Flag any suspicious high-value orders for review",
  },
];

const DECISION_STYLE = {
  auto_executed: {
    icon: <img src={CheckIcon} alt="Executed" className="decision-icon-svg" />,
    label: "Executed",
    cls: "decision-auto",
  },
  pending_sa_approval: {
    icon: <img src={ClockIcon} alt="Pending" className="decision-icon-svg" />,
    label: "Awaiting SA",
    cls: "decision-pending",
  },
  denied: {
    icon: (
      <img src={CrossMarkIcon} alt="Denied" className="decision-icon-svg" />
    ),
    label: "Denied",
    cls: "decision-denied",
  },
  sa_approved: {
    icon: <img src={CheckIcon} alt="Approved" className="decision-icon-svg" />,
    label: "SA Approved",
    cls: "decision-auto",
  },
  sa_rejected: {
    icon: <img src={LockIcon} alt="Rejected" className="decision-icon-svg" />,
    label: "SA Rejected",
    cls: "decision-denied",
  },
};

// Always read token directly from localStorage — same as axios interceptor
function getToken() {
  return localStorage.getItem("token");
}

export default function AIAdminBot() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);
  const [backendOk, setBackendOk] = useState(null); // null=checking, true=ok, false=down
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    setMessages([
      {
        role: "bot",
        text: "👋 Hi! I'm your **AI Admin Bot**.\n\nI can manage products, orders, users, and analytics using natural language commands. Critical actions will be sent to the SuperAdmin for approval before execution.\n\nWhat would you like me to do?",
        time: new Date(),
      },
    ]);
    checkBackend();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Ping the backend first so we show a useful error if it's down
  async function checkBackend() {
    try {
      const res = await fetch(`${API}/admin-ai/stats`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) setStats(data.stats);
        setBackendOk(true);
      } else {
        const errData = await res.json().catch(() => ({}));
        console.error("[AIAdmin] Stats failed:", res.status, errData);
        setBackendOk(res.status === 401 ? "auth" : false);
      }
    } catch (err) {
      console.error("[AIAdmin] Backend unreachable:", err);
      setBackendOk(false);
    }
  }

  async function sendCommand(cmd) {
    const text = (cmd || input).trim();
    if (!text || loading) return;

    const token = getToken();
    if (!token) {
      setMessages((prev) => [
        ...prev,
        {
          role: "bot",
          text: "❌ You are not logged in. Please log in and try again.",
          time: new Date(),
        },
      ]);
      return;
    }

    setInput("");
    setMessages((prev) => [...prev, { role: "user", text, time: new Date() }]);
    setLoading(true);

    try {
      const res = await fetch(`${API}/admin-ai/command`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ command: text }),
      });

      // Parse JSON regardless of status code
      const data = await res.json();

      if (!res.ok) {
        // Server returned an error (4xx / 5xx) — show the real message
        setMessages((prev) => [
          ...prev,
          {
            role: "bot",
            text: `❌ Server error (${res.status}): ${data.message || data.error || "Unknown error"}`,
            time: new Date(),
          },
        ]);
        return;
      }

      setMessages((prev) => [
        ...prev,
        {
          role: "bot",
          text: data.message || "Done.",
          decision: data.decision,
          impact: data.impact,
          auditId: data.auditId,
          time: new Date(),
        },
      ]);

      // Refresh stats after a successful action
      checkBackend();
    } catch (err) {
      // Only network-level failures reach here (server completely down)
      console.error("[AIAdmin] fetch error:", err);
      setMessages((prev) => [
        ...prev,
        {
          role: "bot",
          text: `❌ Cannot reach the backend server.\n\nMake sure:\n• **BackEnd** is running: \`cd BackEnd && npm start\`\n• It is on port **5000**\n\nError: ${err.message}`,
          time: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  function handleKey(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendCommand();
    }
  }

  function formatText(text) {
    return text
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\n/g, "<br/>");
  }

  // Show a banner if backend is confirmed down
  const serverBanner =
    backendOk === false ? (
      <div className="server-banner error">
        ⚠️ Backend not reachable — run{" "}
        <code>cd BackEnd &amp;&amp; npm start</code> then refresh
      </div>
    ) : backendOk === "auth" ? (
      <div className="server-banner warn">
        ⚠️ Authentication error — please log out and log in again
      </div>
    ) : null;

  return (
    <div className="ai-admin-bot">
      {/* Header + Stats */}
      <div className="bot-header">
        <div className="bot-title">
          <span className="bot-avatar">
            <img src={BotIcon} alt="AI Bot" className="bot-avatar-svg" />
          </span>
          <div>
            <h3>AI Admin Bot</h3>
            <span
              className={`bot-status ${backendOk === true ? "online" : backendOk === null ? "checking" : "offline"}`}
            >
              {backendOk === true
                ? "● Online"
                : backendOk === null
                  ? "● Connecting…"
                  : "● Offline"}
            </span>
          </div>
        </div>
        {stats && (
          <div className="bot-stats-row">
            <div className="bot-stat">
              <span>{stats.total}</span>
              <label>Commands</label>
            </div>
            <div className="bot-stat">
              <span>{stats.autoExecuted}</span>
              <label>Auto</label>
            </div>
            <div className="bot-stat">
              <span>{stats.pendingCount}</span>
              <label>Pending</label>
            </div>
            <div className="bot-stat">
              <span>{stats.autonomyRate}%</span>
              <label>Autonomy</label>
            </div>
          </div>
        )}
      </div>

      {serverBanner}

      {/* Quick commands */}
      <div className="quick-commands">
        {QUICK_COMMANDS.map((q) => (
          <button
            key={q.cmd}
            className="quick-btn"
            onClick={() => sendCommand(q.cmd)}
            disabled={loading}
          >
            {q.label}
          </button>
        ))}
      </div>

      {/* Messages */}
      <div className="messages-area">
        {messages.map((msg, i) => (
          <div key={i} className={`message-row ${msg.role}`}>
            {msg.role === "bot" && (
              <span className="msg-avatar">
                <img src={BotIcon} alt="AI Bot" className="msg-avatar-svg" />
              </span>
            )}
            <div className="message-bubble">
              {msg.decision && DECISION_STYLE[msg.decision] && (
                <div
                  className={`decision-badge ${DECISION_STYLE[msg.decision].cls}`}
                >
                  {DECISION_STYLE[msg.decision].icon}{" "}
                  {DECISION_STYLE[msg.decision].label}
                </div>
              )}
              <div
                className="msg-text"
                dangerouslySetInnerHTML={{ __html: formatText(msg.text) }}
              />
              {msg.impact && msg.decision === "pending_sa_approval" && (
                <div className="impact-card">
                  <div className="impact-header">📋 Impact Summary</div>
                  <div className="impact-row">
                    <span>Action</span>
                    <strong>{msg.impact.description}</strong>
                  </div>
                  <div className="impact-row">
                    <span>Target</span>
                    <strong>{msg.impact.affectedEntity}</strong>
                  </div>
                  {msg.impact.currentValue != null && (
                    <div className="impact-row">
                      <span>Current</span>
                      <strong>{String(msg.impact.currentValue)}</strong>
                    </div>
                  )}
                  {msg.impact.proposedValue != null && (
                    <div className="impact-row">
                      <span>Proposed</span>
                      <strong>{String(msg.impact.proposedValue)}</strong>
                    </div>
                  )}
                  <div className={`impact-risk risk-${msg.impact.riskLevel}`}>
                    Risk: {msg.impact.riskLevel?.toUpperCase()}
                  </div>
                </div>
              )}
              <div className="msg-time">
                {msg.time?.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
            </div>
            {msg.role === "user" && (
              <span className="msg-avatar user-avatar">👤</span>
            )}
          </div>
        ))}

        {loading && (
          <div className="message-row bot">
            <span className="msg-avatar">
              <img src={BotIcon} alt="AI Bot" className="msg-avatar-svg" />
            </span>
            <div className="message-bubble">
              <div className="typing-indicator">
                <span />
                <span />
                <span />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="input-area">
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Type an admin command… (e.g. 'Restock fresh milk by 100 units')"
          rows={2}
          disabled={loading}
        />
        <button
          className="send-btn"
          onClick={() => sendCommand()}
          disabled={loading || !input.trim()}
        >
          {loading ? "⏳" : "➤"}
        </button>
      </div>
      <p className="input-hint">
        Press Enter to send · Shift+Enter for new line
      </p>
    </div>
  );
}
