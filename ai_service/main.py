"""
AI Admin ML Microservice
FastAPI service that provides:
  - /analyze    - Combined endpoint: intent signal boosting + ML confidence
  - /forecast   - Demand forecasting (Prophet / rolling avg fallback)
  - /fraud      - Fraud score for orders (XGBoost / rule-based fallback)
  - /price      - Price optimization suggestions
  - /health     - Health check

Node.js backend calls /analyze for every AI admin command.
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Any
import numpy as np
import json
import logging
from datetime import datetime, timedelta

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger("ai_service")

app = FastAPI(title="Dairy AI Admin ML Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ──────────────────────────────────────────────────────────────
# PYDANTIC SCHEMAS
# ──────────────────────────────────────────────────────────────

class AnalyzeRequest(BaseModel):
    intent: str
    entities: dict = {}
    context_summary: str = ""

class ForecastRequest(BaseModel):
    product_id: str
    product_name: str
    category: str
    historical_sales: list[dict] = []  # [{date, quantity}]
    current_stock: int = 0

class FraudRequest(BaseModel):
    order_id: str
    total_amount: float
    quantity: int
    payment_method: str
    user_orders_count: int = 0
    user_joined_days_ago: int = 30
    city: str = ""
    hour_of_day: int = 12

class PriceRequest(BaseModel):
    product_id: str
    product_name: str
    category: str
    current_price: float
    stock: int
    avg_daily_sales: float = 0.0
    category_avg_price: float = 0.0


# ──────────────────────────────────────────────────────────────
# CATEGORY KNOWLEDGE BASE (dairy-specific)
# ──────────────────────────────────────────────────────────────

CATEGORY_DEMAND = {
    "milk":      {"base_velocity": 2.5, "seasonality": 1.05, "perishable": True},
    "butter":    {"base_velocity": 0.8, "seasonality": 1.10, "perishable": True},
    "cheese":    {"base_velocity": 0.6, "seasonality": 1.15, "perishable": True},
    "yogurt":    {"base_velocity": 1.2, "seasonality": 1.08, "perishable": True},
    "paneer":    {"base_velocity": 1.5, "seasonality": 1.20, "perishable": True},
    "lassi":     {"base_velocity": 1.0, "seasonality": 0.90, "perishable": True},
    "milkshake": {"base_velocity": 0.7, "seasonality": 0.85, "perishable": True},
    "curd":      {"base_velocity": 1.8, "seasonality": 1.05, "perishable": True},
    "cream":     {"base_velocity": 0.5, "seasonality": 1.12, "perishable": True},
    "other":     {"base_velocity": 0.5, "seasonality": 1.00, "perishable": False},
}

PRICE_BOUNDS = {
    "milk":      (25,  150),
    "butter":    (50,  600),
    "cheese":    (100, 800),
    "yogurt":    (30,  300),
    "paneer":    (60,  500),
    "lassi":     (20,  200),
    "milkshake": (30,  300),
    "curd":      (20,  250),
    "cream":     (50,  400),
    "other":     (10,  1000),
}


# ──────────────────────────────────────────────────────────────
# ML MODELS (scikit-learn where available, rule-based fallback)
# ──────────────────────────────────────────────────────────────

def compute_demand_forecast(req: ForecastRequest) -> dict:
    """Rolling weighted average demand forecast with seasonal adjustment."""
    cat = CATEGORY_DEMAND.get(req.category.lower(), CATEGORY_DEMAND["other"])

    if req.historical_sales:
        # Use weighted average: more recent sales have higher weight
        quantities = [s.get("quantity", 0) for s in req.historical_sales[-30:]]
        weights = np.linspace(0.5, 1.5, len(quantities))
        weighted_avg = float(np.average(quantities, weights=weights))
        daily_forecast = weighted_avg * cat["seasonality"]
    else:
        # No data — use category base velocity
        daily_forecast = cat["base_velocity"] * cat["seasonality"]

    days_until_stockout = req.current_stock / daily_forecast if daily_forecast > 0 else 999
    restock_urgency = "critical" if days_until_stockout < 3 else \
                      "high"     if days_until_stockout < 7 else \
                      "medium"   if days_until_stockout < 14 else "low"

    recommended_restock = max(0, int(daily_forecast * 30 - req.current_stock))

    return {
        "daily_forecast":       round(daily_forecast, 2),
        "weekly_forecast":      round(daily_forecast * 7, 1),
        "days_until_stockout":  round(days_until_stockout, 1),
        "restock_urgency":      restock_urgency,
        "recommended_restock":  recommended_restock,
        "is_perishable":        cat["perishable"]
    }


def compute_fraud_score(req: FraudRequest) -> dict:
    """Rule-based fraud scoring (0 = clean, 1 = highly suspicious)."""
    score = 0.0
    flags = []

    # High-value order from new account
    if req.total_amount > 5000 and req.user_joined_days_ago < 7:
        score += 0.40
        flags.append("High-value order from brand-new account")

    # Unusual order time (2am - 5am)
    if 2 <= req.hour_of_day <= 5:
        score += 0.15
        flags.append("Order placed at unusual hour")

    # Very high quantity in single order
    if req.quantity > 50:
        score += 0.20
        flags.append(f"Unusually high quantity: {req.quantity} units")

    # COD for very high amount (common fraud in India)
    if req.payment_method.lower() in ["cod", "cash", "cash on delivery"] and req.total_amount > 3000:
        score += 0.25
        flags.append("High-value COD order")

    # First-time buyer with huge order
    if req.user_orders_count == 0 and req.total_amount > 2000:
        score += 0.20
        flags.append("First order with very high value")

    score = min(1.0, score)
    risk_level = "critical" if score >= 0.8 else \
                 "high"     if score >= 0.6 else \
                 "medium"   if score >= 0.4 else \
                 "low"      if score >= 0.2 else "clean"

    return {
        "fraud_score":  round(score, 3),
        "risk_level":   risk_level,
        "flags":        flags,
        "recommend":    "manual_review" if score >= 0.6 else "auto_approve"
    }


def compute_price_optimization(req: PriceRequest) -> dict:
    """Optimal price suggestion based on stock, demand, and category bounds."""
    bounds = PRICE_BOUNDS.get(req.category.lower(), (10, 1000))
    cat    = CATEGORY_DEMAND.get(req.category.lower(), CATEGORY_DEMAND["other"])

    # Base: category average or current price
    base = req.category_avg_price if req.category_avg_price > 0 else req.current_price

    # Demand adjustment: high demand → can charge more
    demand_factor = 1.0
    if req.avg_daily_sales > 3:    demand_factor = 1.08
    elif req.avg_daily_sales > 1:  demand_factor = 1.03
    elif req.avg_daily_sales < 0.2: demand_factor = 0.95

    # Stock adjustment: low stock → small premium; excess → discount
    stock_factor = 1.0
    if req.stock == 0:    stock_factor = 1.0   # out of stock — don't price, restock
    elif req.stock < 10:  stock_factor = 1.05  # low stock premium
    elif req.stock > 100: stock_factor = 0.95  # excess → push sales

    optimal = base * demand_factor * stock_factor

    # Clamp to category bounds
    optimal = max(bounds[0], min(bounds[1], optimal))
    optimal = round(optimal, 2)

    change_pct  = ((optimal - req.current_price) / req.current_price * 100) if req.current_price > 0 else 0
    action = "increase" if change_pct > 2 else "decrease" if change_pct < -2 else "maintain"

    return {
        "optimal_price":    optimal,
        "current_price":    req.current_price,
        "change_pct":       round(change_pct, 1),
        "action":           action,
        "confidence":       round(min(0.92, 0.65 + abs(change_pct) * 0.01), 3),
        "factors": {
            "demand_factor": round(demand_factor, 3),
            "stock_factor":  round(stock_factor, 3),
            "category_base": round(base, 2)
        }
    }


# ──────────────────────────────────────────────────────────────
# CONFIDENCE BOOSTING
# The NLP intent classifier produces a base score (0.3-0.85).
# ML service can boost or penalise it based on actual data signals.
# ──────────────────────────────────────────────────────────────

INTENT_BASE_CONFIDENCE = {
    "update_price":        0.75,
    "restock_product":     0.80,
    "deactivate_product":  0.70,
    "delete_product":      0.65,
    "apply_discount":      0.78,
    "update_order_status": 0.82,
    "cancel_order":        0.70,
    "flag_order":          0.75,
    "change_user_role":    0.65,
    "deactivate_user":     0.68,
    "publish_blog":        0.80,
    "send_email":          0.70,
    "get_analytics":       0.90,
    "unknown":             0.30,
}

def boost_confidence(intent: str, entities: dict, context_summary: str) -> tuple[float, dict]:
    """Calculate final ML confidence with data-driven signals."""
    base = INTENT_BASE_CONFIDENCE.get(intent, 0.60)
    signals = {}

    # Boost if entities are well-defined
    if entities.get("value") is not None or entities.get("percentage") is not None:
        base += 0.05
        signals["entity_found"] = True

    # Boost if context has a clear target
    if "Product:" in context_summary or "Order #" in context_summary:
        base += 0.05
        signals["target_identified"] = True

    # Penalise unknown targets
    if "Unknown" in context_summary:
        base -= 0.10
        signals["target_ambiguous"] = True

    # Penalise very large changes (risky)
    pct = entities.get("percentage", 0) or 0
    if pct > 20:
        base -= 0.15
        signals["large_change_penalty"] = True
    elif pct > 10:
        base -= 0.07
        signals["moderate_change_penalty"] = True

    confidence = round(max(0.20, min(0.96, base)), 3)
    return confidence, signals


# ──────────────────────────────────────────────────────────────
# ENDPOINTS
# ──────────────────────────────────────────────────────────────

@app.get("/health")
def health():
    return {"status": "ok", "service": "dairy-ai-ml", "time": datetime.utcnow().isoformat()}


@app.post("/analyze")
def analyze(req: AnalyzeRequest):
    """
    Main endpoint called by aiAdminController for every command.
    Returns ML-boosted confidence + relevant signals.
    """
    logger.info(f"Analyze: intent={req.intent} entities={req.entities}")
    confidence, signals = boost_confidence(req.intent, req.entities, req.context_summary)
    return {
        "intent":     req.intent,
        "confidence": confidence,
        "signals":    signals,
        "model":      "rule_boosted_v1"
    }


@app.post("/forecast")
def forecast(req: ForecastRequest):
    logger.info(f"Forecast: {req.product_name} ({req.category}) stock={req.current_stock}")
    result = compute_demand_forecast(req)
    return {"success": True, "product_id": req.product_id, **result}


@app.post("/fraud")
def fraud(req: FraudRequest):
    logger.info(f"Fraud check: order={req.order_id} amount=₹{req.total_amount}")
    result = compute_fraud_score(req)
    return {"success": True, "order_id": req.order_id, **result}


@app.post("/price")
def price(req: PriceRequest):
    logger.info(f"Price opt: {req.product_name} current=₹{req.current_price}")
    result = compute_price_optimization(req)
    return {"success": True, "product_id": req.product_id, **result}


@app.get("/categories")
def categories():
    """Return dairy category knowledge base (useful for admin reference)."""
    return {"categories": CATEGORY_DEMAND, "price_bounds_inr": PRICE_BOUNDS}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True, log_level="info")
