import { useState, useEffect } from "react";
import "./PendingApprovals.css";
import LockIcon from "../../assets/lock-pad.svg";
import CheckIcon from "../../assets/check.svg";
import CrossMarkIcon from "../../assets/cross-mark.svg";
import ClockIcon from "../../assets/clock.svg";
import TargetIcon from "../../assets/suspicious.svg";

const API = "/api";
const getToken = () => localStorage.getItem("token");

const RISK_CONFIG = {
  low: { color: "#065f46", bg: "#d1fae5", label: "Low Risk" },
  medium: { color: "#92400e", bg: "#fef3c7", label: "Medium Risk" },
  high: { color: "#991b1b", bg: "#fee2e2", label: "High Risk" },
  critical: { color: "#fff", bg: "#7f1d1d", label: "Critical" },
};

export default function PendingApprovals({ onCountChange }) {
  const token = getToken();
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionNote, setActionNote] = useState("");
  const [processing, setProcessing] = useState(null); // id being processed

  useEffect(() => {
    fetchPending();
    // Poll every 30 seconds for new requests
    const interval = setInterval(fetchPending, 30000);
    return () => clearInterval(interval);
  }, []);

  async function fetchPending() {
    try {
      const res = await fetch(`${API}/admin-ai/pending`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setApprovals(data.data);
        onCountChange?.(data.count);
      }
    } catch (_) {
    } finally {
      setLoading(false);
    }
  }

  async function handleDecision(id, action, note = "") {
    setProcessing(id);
    try {
      const res = await fetch(`${API}/admin-ai/${action}/${id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ note }),
      });
      const data = await res.json();
      if (data.success) {
        // Remove from list
        setApprovals((prev) => prev.filter((a) => a._id !== id));
        onCountChange?.(approvals.length - 1);
      } else {
        alert(data.message || "Action failed");
      }
    } catch (err) {
      alert("Network error. Please try again.");
    } finally {
      setProcessing(null);
      setActionNote("");
    }
  }

  if (loading) {
    return (
      <div className="pa-wrapper">
        <div className="pa-loading">Loading pending approvals...</div>
      </div>
    );
  }

  return (
    <div className="pa-wrapper">
      <div className="pa-header">
        <div className="pa-title">
          <span className="pa-icon">
            <img src={LockIcon} alt="Approvals" className="pa-icon-svg" />
          </span>
          <div>
            <h3>AI Bot — Pending Approvals</h3>
            <p>Review actions the AI Admin Bot wants to perform</p>
          </div>
        </div>
        {approvals.length > 0 && (
          <span className="pa-badge">{approvals.length} waiting</span>
        )}
      </div>

      {approvals.length === 0 ? (
        <div className="pa-empty">
          <span className="pa-empty-icon">
            <img
              src={CheckIcon}
              alt="All clear"
              className="pa-empty-icon-svg"
            />
          </span>
          <p>No pending approvals</p>
          <small>
            The AI bot is running autonomously. All critical actions will appear
            here.
          </small>
        </div>
      ) : (
        <div className="pa-list">
          {approvals.map((approval) => {
            const risk = RISK_CONFIG[approval.impact?.riskLevel || "medium"];
            const isLoading = processing === approval._id;
            const timeAgo = getTimeAgo(approval.createdAt);

            return (
              <div key={approval._id} className="pa-card">
                {/* Risk badge + time */}
                <div className="pa-card-meta">
                  <span
                    className="pa-risk-badge"
                    style={{ background: risk.bg, color: risk.color }}
                  >
                    {risk.label}
                  </span>
                  <span className="pa-time">
                    <img src={ClockIcon} alt="Time" className="pa-time-icon" />{" "}
                    {timeAgo}
                  </span>
                  <span className="pa-confidence">
                    <img
                      src={TargetIcon}
                      alt="Confidence"
                      className="pa-confidence-icon"
                    />{" "}
                    {Math.round((approval.confidence || 0) * 100)}% confidence
                  </span>
                </div>

                {/* Action summary */}
                <div className="pa-action-summary">
                  <span className="pa-intent-tag">
                    {approval.intent?.replace(/_/g, " ")}
                  </span>
                  <p className="pa-description">{approval.actionSummary}</p>
                </div>

                {/* Original command */}
                <div className="pa-command">
                  <label>Original command:</label>
                  <blockquote>"{approval.rawCommand}"</blockquote>
                </div>

                {/* Impact details */}
                {approval.impact && (
                  <div className="pa-impact">
                    <div className="pa-impact-row">
                      <span>Target</span>
                      <strong>{approval.impact.affectedEntity}</strong>
                    </div>
                    {approval.impact.currentValue != null && (
                      <div className="pa-impact-row">
                        <span>Current value</span>
                        <strong>{String(approval.impact.currentValue)}</strong>
                      </div>
                    )}
                    {approval.impact.proposedValue != null && (
                      <div className="pa-impact-row">
                        <span>Proposed value</span>
                        <strong className="proposed">
                          {String(approval.impact.proposedValue)}
                        </strong>
                      </div>
                    )}
                  </div>
                )}

                {/* Note field */}
                <div className="pa-note-area">
                  <input
                    type="text"
                    placeholder="Add a note (optional)..."
                    onChange={(e) => setActionNote(e.target.value)}
                    disabled={isLoading}
                  />
                </div>

                {/* Actions */}
                <div className="pa-actions">
                  <button
                    className="pa-btn pa-approve"
                    onClick={() =>
                      handleDecision(approval._id, "approve", actionNote)
                    }
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      "Processing..."
                    ) : (
                      <>
                        <img
                          src={CheckIcon}
                          alt="Approve"
                          className="pa-btn-icon"
                        />{" "}
                        Approve & Execute
                      </>
                    )}
                  </button>
                  <button
                    className="pa-btn pa-reject"
                    onClick={() =>
                      handleDecision(approval._id, "reject", actionNote)
                    }
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      "..."
                    ) : (
                      <>
                        <img
                          src={CrossMarkIcon}
                          alt="Reject"
                          className="pa-btn-icon"
                        />{" "}
                        Reject
                      </>
                    )}
                  </button>
                </div>

                {/* Expiry warning */}
                {approval.expiresAt && (
                  <div className="pa-expiry">
                    Auto-expires:{" "}
                    {new Date(approval.expiresAt).toLocaleString()}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function getTimeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(mins / 60);
  if (hours > 0) return `${hours}h ago`;
  if (mins > 0) return `${mins}m ago`;
  return "Just now";
}
