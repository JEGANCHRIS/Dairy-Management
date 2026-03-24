# AI Admin Bot — Setup & Integration Guide

## What was built

| File | Purpose |
|------|---------|
| `BackEnd/models/AuditLog.js` | Stores every bot decision with intent, confidence, outcome |
| `BackEnd/models/PendingApproval.js` | Queue for critical actions awaiting SuperAdmin |
| `BackEnd/controllers/aiAdminController.js` | Core engine: NLP + RAG + ML + decision routing |
| `BackEnd/routes/adminAI.js` | REST endpoints (updated, preserves existing `/summary`) |
| `ai_service/main.py` | Python FastAPI: demand forecast, fraud score, price optimizer |
| `ai_service/requirements.txt` | Python dependencies |
| `ai_service/start.sh` | One-command Python service launcher |
| `FrontEnd/.../AIAdminBot.jsx` | Chat UI for Admin & SuperAdmin dashboards |
| `FrontEnd/.../PendingApprovals.jsx` | SuperAdmin approval panel (auto-polls every 30s) |
| `FrontEnd/.../AuditLog.jsx` | Paginated audit trail with filters |
| `FrontEnd/.../AIAdminBot.css` | Bot chat styles |
| `FrontEnd/.../PendingApprovals.css` | Approval card styles |
| `FrontEnd/.../AuditLog.css` | Audit table styles |

## How to start

### 1. Python ML Microservice
```bash
cd ai_service
chmod +x start.sh
./start.sh
# Runs on http://localhost:8000
# API docs: http://localhost:8000/docs
```

### 2. Node.js Backend
The `.env` already has `ML_SERVICE_URL=http://localhost:8000` added.
```bash
cd BackEnd
npm install
npm start
```

### 3. Frontend (no changes needed)
```bash
cd FrontEnd
npm install
npm run dev
```

## API Endpoints

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| `POST` | `/api/admin-ai/command` | admin, superAdmin | Send a natural language command |
| `GET`  | `/api/admin-ai/stats` | admin, superAdmin | Bot performance statistics |
| `GET`  | `/api/admin-ai/audit-logs` | admin, superAdmin | Full audit trail |
| `GET`  | `/api/admin-ai/pending` | superAdmin only | List pending approvals |
| `POST` | `/api/admin-ai/approve/:id` | superAdmin only | Approve a pending action |
| `POST` | `/api/admin-ai/reject/:id` | superAdmin only | Reject a pending action |

### Example command request
```json
POST /api/admin-ai/command
Authorization: Bearer <token>
{
  "command": "Restock fresh milk by 100 units"
}
```

### Auto-execute response
```json
{
  "success": true,
  "decision": "auto_executed",
  "message": "✅ Restocked Fresh Milk: 20 → 120 units",
  "auditId": "..."
}
```

### SA gate response
```json
{
  "success": true,
  "decision": "pending_sa_approval",
  "message": "⏳ Action queued for SuperAdmin approval...",
  "pendingId": "...",
  "impact": {
    "description": "Change product price by 20%",
    "affectedEntity": "Product: Paneer",
    "currentValue": 120,
    "proposedValue": 144,
    "riskLevel": "high"
  }
}
```

## Decision rules

| Action | Condition | Decision |
|--------|-----------|----------|
| Price change | ≤ 10% | Auto-execute |
| Price change | > 10% | SA gate |
| Discount | ≤ 15% | Auto-execute |
| Discount | > 15% | SA gate |
| Restock | Any | Auto-execute |
| Order status update | Any | Auto-execute |
| Flag suspicious order | Any | Auto-execute |
| View analytics | Any | Auto-execute |
| Cancel/refund order | Always | SA gate |
| Delete/deactivate product | Always | SA gate |
| Change user role | Always | SA gate |
| Deactivate user | Always | SA gate |
| Mass email | Always | SA gate |
| Payment credentials | Always | **BLOCKED** |
| Delete user data | Always | **BLOCKED** |

## ML Microservice endpoints

```
POST /analyze   — confidence boosting (called by Node for every command)
POST /forecast  — demand forecast for a product
POST /fraud     — fraud score for an order
POST /price     — price optimization suggestion
GET  /health    — service health check
GET  /categories — dairy category knowledge base
```

## Dashboard navigation

**SuperAdmin Dashboard** → 3 new tabs:
- 🤖 **AI Admin Bot** — chat with the bot directly
- 🔐 **Approvals** — review and approve/reject pending actions (badge shows count)
- 🗂 **AI Audit** — full paginated audit trail

**Admin Dashboard** → 2 new tabs:
- 🤖 **AI Admin Bot** — chat interface
- 🗂 **AI Audit** — read-only audit trail

## How NLP fallback works

1. **Keyword matching** — fast, covers all 13 known intents using 4–8 keywords each
2. **Ollama fallback** — if no keyword match, sends the command to your local Ollama (llama3.2) for classification with JSON output
3. **Unknown → SA gate** — if neither classifier is confident, it routes to the SuperAdmin for safety

## Running tests
```bash
cd BackEnd
node test-ai-admin.js
# Expected: 14/14 PASS
```

## Environment variables added
```
ML_SERVICE_URL=http://localhost:8000   # Python ML service
```
All other variables (`MONGODB_URI`, `OLLAMA_URL`, etc.) remain unchanged.
