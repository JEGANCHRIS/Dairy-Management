import { useState, useEffect } from "react";
import "./AuditLog.css";
import AiAuditIcon from "../../assets/Ai-audit.svg";
import CheckIcon from "../../assets/check.svg";
import CrossMarkIcon from "../../assets/cross-mark.svg";
import ClockIcon from "../../assets/clock.svg";
import TargetIcon from "../../assets/suspicious.svg";

const API = "/api";
const getToken = () => localStorage.getItem("token");

const DECISION_CONFIG = {
  auto_executed: { label: "Auto Executed", color: "#065f46", bg: "#d1fae5" },
  pending_sa_approval: { label: "Pending SA", color: "#92400e", bg: "#fef3c7" },
  denied: { label: "Denied", color: "#991b1b", bg: "#fee2e2" },
  sa_approved: { label: "SA Approved", color: "#065f46", bg: "#d1fae5" },
  sa_rejected: { label: "SA Rejected", color: "#991b1b", bg: "#fee2e2" },
};

export default function AuditLog() {
  const token = getToken();
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState({ intent: "", decision: "" });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, [page, filter]);

  async function fetchLogs() {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 15 });
      if (filter.intent) params.set("intent", filter.intent);
      if (filter.decision) params.set("decision", filter.decision);

      const res = await fetch(`${API}/admin-ai/audit-logs?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setLogs(data.data);
        setTotal(data.total);
      }
    } catch (_) {
    } finally {
      setLoading(false);
    }
  }

  const pages = Math.ceil(total / 15);

  return (
    <div className="al-wrapper">
      <div className="al-header">
        <div className="al-title">
          <span className="al-icon">
            <img src={AiAuditIcon} alt="Audit" className="al-icon-svg" />
          </span>
          <div>
            <h3>AI Admin Audit Trail</h3>
            <p>{total} total actions logged</p>
          </div>
        </div>
        <div className="al-filters">
          <select
            value={filter.intent}
            onChange={(e) => {
              setFilter((f) => ({ ...f, intent: e.target.value }));
              setPage(1);
            }}
          >
            <option value="">All intents</option>
            <option value="update_price">Update price</option>
            <option value="restock_product">Restock</option>
            <option value="apply_discount">Discount</option>
            <option value="update_order_status">Order status</option>
            <option value="cancel_order">Cancel order</option>
            <option value="change_user_role">Change role</option>
            <option value="get_analytics">Analytics</option>
          </select>
          <select
            value={filter.decision}
            onChange={(e) => {
              setFilter((f) => ({ ...f, decision: e.target.value }));
              setPage(1);
            }}
          >
            <option value="">All decisions</option>
            <option value="auto_executed">Auto executed</option>
            <option value="pending_sa_approval">Pending</option>
            <option value="sa_approved">SA Approved</option>
            <option value="sa_rejected">SA Rejected</option>
            <option value="denied">Denied</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="al-loading">Loading audit logs...</div>
      ) : logs.length === 0 ? (
        <div className="al-empty">No audit log entries found</div>
      ) : (
        <div className="al-table-wrap">
          <table className="al-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Command</th>
                <th>Intent</th>
                <th>Confidence</th>
                <th>Decision</th>
                <th>Outcome</th>
                <th>Reviewed by</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => {
                const dc = DECISION_CONFIG[log.decision] || {};
                const conf = Math.round((log.confidence || 0) * 100);
                return (
                  <tr key={log._id}>
                    <td className="al-time">
                      {new Date(log.createdAt).toLocaleString("en-IN", {
                        dateStyle: "short",
                        timeStyle: "short",
                      })}
                    </td>
                    <td className="al-cmd" title={log.rawCommand}>
                      {log.rawCommand?.slice(0, 55)}
                      {log.rawCommand?.length > 55 ? "…" : ""}
                    </td>
                    <td>
                      <span className="al-intent">
                        {log.intent?.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td>
                      <div className="al-conf-bar">
                        <div
                          className="al-conf-fill"
                          style={{
                            width: `${conf}%`,
                            background:
                              conf >= 80
                                ? "#10b981"
                                : conf >= 60
                                  ? "#f59e0b"
                                  : "#ef4444",
                          }}
                        />
                        <span>{conf}%</span>
                      </div>
                    </td>
                    <td>
                      <span
                        className="al-decision"
                        style={{ background: dc.bg, color: dc.color }}
                      >
                        {dc.label}
                      </span>
                    </td>
                    <td>
                      <div className="al-outcome-details">
                        <div className="al-outcome-details-text">
                          {log.outcome?.success === true && (
                            <img
                              src={CheckIcon}
                              alt="Success"
                              className="al-outcome-icon"
                            />
                          )}
                          {log.outcome?.success === false && (
                            <img
                              src={CrossMarkIcon}
                              alt="Failed"
                              className="al-outcome-icon"
                            />
                          )}
                          <span>{log.outcome?.message}</span>
                        </div>
                      </div>
                    </td>
                    <td className="al-reviewer">
                      {log.reviewedBy?.name || "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {pages > 1 && (
        <div className="al-pagination">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            ← Prev
          </button>
          <span>
            Page {page} of {pages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(pages, p + 1))}
            disabled={page === pages}
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
