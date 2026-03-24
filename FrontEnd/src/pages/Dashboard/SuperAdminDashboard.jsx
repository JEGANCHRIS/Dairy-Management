import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../utils/api";
import { error } from "../../utils/toast.jsx";
import "../../styles/dashboard.css";
import AnalyticsTabs from "../../components/AnalyticsTabs";
import AIAdminBot from "../../components/AIAdmin/AIAdminBot";
import PendingApprovals from "../../components/AIAdmin/PendingApprovals";
import AuditLog from "../../components/AIAdmin/AuditLog";
import BotIcon from "../../assets/bot.svg";
import LockIcon from "../../assets/lock-pad.svg";
import SettingsIcon from "../../assets/settings.svg";
import UsersIcon from "../../assets/users-logo.svg";
import ProductBoxIcon from "../../assets/product-box.svg";
import OrdersIcon from "../../assets/orders.svg";
import MoneyIcon from "../../assets/money-bag.svg";
import PaymentCardIcon from "../../assets/payment-card.svg";

const SuperAdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [systemHealth, setSystemHealth] = useState(null);
  const [auditLogs, setAuditLogs] = useState(null);
  const [paymentConfig, setPaymentConfig] = useState(null);
  const [userAnalytics, setUserAnalytics] = useState(null);
  const [productAnalytics, setProductAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [pendingCount, setPendingCount] = useState(0);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);

      console.log("📊 Fetching dashboard data...");

      const [
        statsRes,
        healthRes,
        auditRes,
        paymentRes,
        userRes,
        productAnalRes,
      ] = await Promise.all([
        api.get("/admin/dashboard/stats").catch((err) => {
          console.error(
            "❌ Stats API error:",
            err.response?.data || err.message,
          );
          return { data: null };
        }),
        api.get("/admin/system-health").catch((err) => {
          console.error(
            "❌ System health API error:",
            err.response?.data || err.message,
          );
          return { data: null };
        }),
        api.get("/admin/audit-logs").catch((err) => {
          console.error(
            "❌ Audit logs API error:",
            err.response?.data || err.message,
          );
          return { data: null };
        }),
        api.get("/payments/config").catch((err) => {
          console.error(
            "❌ Payment config API error:",
            err.response?.data || err.message,
          );
          return { data: null };
        }),
        api.get("/admin/analytics/users").catch(() => ({ data: null })),
        api.get("/admin/analytics/products").catch(() => ({ data: null })),
      ]);

      console.log("📊 Stats Data:", statsRes.data);

      setStats(statsRes.data);
      setSystemHealth(healthRes.data);
      setAuditLogs(auditRes.data);
      setPaymentConfig(paymentRes.data);
      setUserAnalytics(userRes.data);
      setProductAnalytics(productAnalRes.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePaymentConfig = async (newConfig) => {
    try {
      await api.put("/payments/config", newConfig);
      setShowPaymentModal(false);
      fetchAllData();
    } catch (error) {
      console.error("Error updating payment config:", error);
      error("Error updating payment configuration");
    }
  };

  if (loading) {
    return (
      <section className="dashboard">
        <div className="container">
          <div className="loading">Loading dashboard...</div>
        </div>
      </section>
    );
  }

  return (
    <section className="dashboard super-admin-dashboard">
      <div className="container">
        <h1>Super Admin Dashboard</h1>

        <div className="dashboard-tabs">
          <button
            className={`tab-btn ${activeTab === "overview" ? "active" : ""}`}
            onClick={() => setActiveTab("overview")}
          >
            Overview
          </button>
          <button
            className={`tab-btn ${activeTab === "users" ? "active" : ""}`}
            onClick={() => navigate("/user-management")}
          >
            User Management
          </button>
          <button
            className={`tab-btn ${activeTab === "payments" ? "active" : ""}`}
            onClick={() => setActiveTab("payments")}
          >
            Payment Config
          </button>
          <button
            className={`tab-btn ${activeTab === "bank-accounts" ? "active" : ""}`}
            onClick={() => navigate("/admin/bank-accounts")}
          >
            Bank Accounts
          </button>
          <button
            className={`tab-btn ${activeTab === "audit" ? "active" : ""}`}
            onClick={() => setActiveTab("audit")}
          >
            Audit Logs
          </button>
          <button
            className={`tab-btn ${activeTab === "system" ? "active" : ""}`}
            onClick={() => setActiveTab("system")}
          >
            System Health
          </button>
          <button
            className={`tab-btn ${activeTab === "user-analytics" ? "active" : ""}`}
            onClick={() => setActiveTab("user-analytics")}
          >
            User Analytics
          </button>
          <button
            className={`tab-btn ${activeTab === "product-analytics" ? "active" : ""}`}
            onClick={() => setActiveTab("product-analytics")}
          >
            Product Analytics
          </button>
          <button
            className={`tab-btn ai-tab ${activeTab === "ai-bot" ? "active" : ""}`}
            onClick={() => setActiveTab("ai-bot")}
          >
            <img src={BotIcon} alt="AI" className="tab-icon-svg" /> AI Admin Bot
          </button>
          <button
            className={`tab-btn ai-tab ${activeTab === "ai-approvals" ? "active" : ""}`}
            onClick={() => setActiveTab("ai-approvals")}
          >
            <img src={LockIcon} alt="Approvals" className="tab-icon-svg" />{" "}
            Approvals
            {pendingCount > 0 && (
              <span className="pending-dot">{pendingCount}</span>
            )}
          </button>
          <button
            className={`tab-btn ai-tab ${activeTab === "ai-audit" ? "active" : ""}`}
            onClick={() => setActiveTab("ai-audit")}
          >
            <img src={SettingsIcon} alt="Audit" className="tab-icon-svg" /> AI
            Audit
          </button>
        </div>

        {activeTab === "overview" && stats && (
          <>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon">
                  <img src={UsersIcon} alt="Users" className="stat-icon-svg" />
                </div>
                <h3>Total Users</h3>
                <div className="stat-number">{stats.users?.total || 0}</div>
                <div className="stat-change positive">
                  +{stats.users?.newToday || 0} today
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">
                  <img
                    src={ProductBoxIcon}
                    alt="Products"
                    className="stat-icon-svg"
                  />
                </div>
                <h3>Total Products</h3>
                <div className="stat-number">{stats.products?.total || 0}</div>
                <div className="stat-change positive">
                  {stats.products?.totalStock || 0} units in stock
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">
                  <img
                    src={OrdersIcon}
                    alt="Orders"
                    className="stat-icon-svg"
                  />
                </div>
                <h3>Total Orders</h3>
                <div className="stat-number">{stats.orders?.total || 0}</div>
                <div className="stat-change positive">
                  {stats.orders?.completed || 0} completed
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">
                  <img
                    src={MoneyIcon}
                    alt="Revenue"
                    className="stat-icon-svg"
                  />
                </div>
                <h3>Monthly Revenue</h3>
                <div className="stat-number">
                  ₹{(stats.revenue?.thisMonth || 0).toFixed(2)}
                </div>
                <div className="stat-change positive">This month</div>
              </div>
            </div>

            <div className="quick-links">
              <h3>Quick Actions</h3>
              <div className="links-grid">
                <Link to="/user-management" className="quick-link">
                  <span className="link-icon">
                    <img
                      src={UsersIcon}
                      alt="Users"
                      className="link-icon-svg"
                    />
                  </span>
                  Manage Users
                </Link>
                <Link to="/admin/products" className="quick-link">
                  <span className="link-icon">
                    <img
                      src={ProductBoxIcon}
                      alt="Products"
                      className="link-icon-svg"
                    />
                  </span>
                  Manage Products
                </Link>
                <Link to="/admin/orders" className="quick-link">
                  <span className="link-icon">
                    <img
                      src={OrdersIcon}
                      alt="Orders"
                      className="link-icon-svg"
                    />
                  </span>
                  View All Orders
                </Link>
                <button
                  onClick={() => setActiveTab("payments")}
                  className="quick-link"
                >
                  <span className="link-icon">
                    <img
                      src={PaymentCardIcon}
                      alt="Payment"
                      className="link-icon-svg"
                    />
                  </span>
                  Payment Settings
                </button>
              </div>
            </div>
          </>
        )}

        {activeTab === "payments" && paymentConfig && (
          <div className="payment-config">
            <div className="section-header">
              <h2>Payment Configuration</h2>
              <button
                className="btn btn-primary"
                onClick={() => setShowPaymentModal(true)}
              >
                Edit Configuration
              </button>
            </div>

            <div className="config-section">
              <h3>Currency</h3>
              <p>{paymentConfig.currency}</p>
            </div>

            <div className="config-section">
              <h3>Tax Rate</h3>
              <p>{paymentConfig.taxRate}%</p>
            </div>

            <div className="config-section">
              <h3>Shipping Rates</h3>
              <div className="shipping-rates-list">
                {paymentConfig.shippingRates?.map((rate, index) => (
                  <div key={index} className="shipping-rate">
                    <span>{rate.name}</span>
                    <span>₹{rate.price}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="config-section">
              <h3>Payment Methods</h3>
              <div className="payment-methods-list">
                {paymentConfig.paymentMethods?.map((method, index) => (
                  <div
                    key={index}
                    className={`payment-method ${method.isActive ? "active" : ""}`}
                  >
                    <div className="payment-method-info">
                      <span className="method-name">{method.name}</span>
                      <span
                        className={`method-status ${method.isActive ? "active" : "inactive"}`}
                      >
                        {method.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "audit" && auditLogs && (
          <div className="audit-logs">
            <h2>Recent Activity</h2>

            <div className="audit-section">
              <h3>Recent Orders</h3>
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Order ID</th>
                      <th>User</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditLogs.recentOrders?.map((order) => (
                      <tr key={order._id}>
                        <td>#{order._id.slice(-8)}</td>
                        <td>{order.user?.name}</td>
                        <td>₹{order.totalAmount}</td>
                        <td>
                          <span className={`badge badge-${order.orderStatus}`}>
                            {order.orderStatus}
                          </span>
                        </td>
                        <td>{new Date(order.createdAt).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="audit-section">
              <h3>Recent Users</h3>
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Joined</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditLogs.recentUsers?.map((user) => (
                      <tr key={user._id}>
                        <td>{user.name}</td>
                        <td>{user.email}</td>
                        <td>
                          <span className={`role-badge ${user.role}`}>
                            {user.role}
                          </span>
                        </td>
                        <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === "system" && systemHealth && (
          <div className="system-health">
            <h2>System Health</h2>

            <div className="health-grid">
              <div className="health-card">
                <h3>Database</h3>
                <div
                  className={`health-status ${systemHealth.database === "connected" ? "good" : "bad"}`}
                >
                  {systemHealth.database}
                </div>
              </div>

              <div className="health-card">
                <h3>Uptime</h3>
                <div className="health-value">
                  {Math.floor(systemHealth.uptime / 3600)}h{" "}
                  {Math.floor((systemHealth.uptime % 3600) / 60)}m
                </div>
              </div>

              <div className="health-card">
                <h3>Active Users (24h)</h3>
                <div className="health-value">{systemHealth.activeUsers}</div>
              </div>

              <div className="health-card">
                <h3>Memory Usage</h3>
                <div className="health-value">
                  {Math.round(systemHealth.memoryUsage?.heapUsed / 1024 / 1024)}{" "}
                  MB
                </div>
              </div>
            </div>

            <div className="health-details">
              <h3>System Details</h3>
              <pre className="health-data">
                {JSON.stringify(systemHealth, null, 2)}
              </pre>
            </div>
          </div>
        )}

        {activeTab === "user-analytics" && (
          <AnalyticsTabs
            activeAnalyticsTab="users"
            stats={stats}
            userAnalytics={userAnalytics}
            productAnalytics={productAnalytics}
            paymentConfig={paymentConfig}
          />
        )}

        {activeTab === "product-analytics" && (
          <AnalyticsTabs
            activeAnalyticsTab="products"
            stats={stats}
            userAnalytics={userAnalytics}
            productAnalytics={productAnalytics}
            paymentConfig={paymentConfig}
          />
        )}

        {activeTab === "ai-bot" && (
          <div className="ai-tab-layout">
            <AIAdminBot />
          </div>
        )}

        {activeTab === "ai-approvals" && (
          <div className="ai-tab-layout">
            <PendingApprovals onCountChange={setPendingCount} />
          </div>
        )}

        {activeTab === "ai-audit" && (
          <div className="ai-tab-layout">
            <AuditLog />
          </div>
        )}
      </div>

      {showPaymentModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowPaymentModal(false)}
        >
          <div
            className="modal-content large"
            onClick={(e) => e.stopPropagation()}
          >
            <h2>Edit Payment Configuration</h2>
            <button
              type="button"
              className="modal-close-btn"
              onClick={() => setShowPaymentModal(false)}
            >
              ×
            </button>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleUpdatePaymentConfig(paymentConfig);
              }}
              className="payment-form"
            >
              <div className="form-group">
                <label>Currency</label>
                <select
                  value={paymentConfig.currency}
                  onChange={(e) =>
                    setPaymentConfig({
                      ...paymentConfig,
                      currency: e.target.value,
                    })
                  }
                >
                  <option value="INR">INR (₹)</option>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                </select>
              </div>

              <div className="form-group">
                <label>Tax Rate (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={paymentConfig.taxRate}
                  onChange={(e) =>
                    setPaymentConfig({
                      ...paymentConfig,
                      taxRate: e.target.value,
                    })
                  }
                />
              </div>

              <h3>Shipping Rates</h3>
              {paymentConfig.shippingRates?.map((rate, index) => (
                <div key={index} className="shipping-rate-form">
                  <input
                    type="text"
                    value={rate.name}
                    onChange={(e) => {
                      const newRates = [...paymentConfig.shippingRates];
                      newRates[index].name = e.target.value;
                      setPaymentConfig({
                        ...paymentConfig,
                        shippingRates: newRates,
                      });
                    }}
                    placeholder="Rate name"
                  />
                  <input
                    type="number"
                    value={rate.price}
                    onChange={(e) => {
                      const newRates = [...paymentConfig.shippingRates];
                      newRates[index].price = Number(e.target.value);
                      setPaymentConfig({
                        ...paymentConfig,
                        shippingRates: newRates,
                      });
                    }}
                    placeholder="Price"
                  />
                  <button
                    type="button"
                    className="btn-icon remove"
                    onClick={() => {
                      setPaymentConfig({
                        ...paymentConfig,
                        shippingRates: paymentConfig.shippingRates.filter(
                          (_, i) => i !== index,
                        ),
                      });
                    }}
                  >
                    ✖
                  </button>
                </div>
              ))}
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setPaymentConfig({
                    ...paymentConfig,
                    shippingRates: [
                      ...(paymentConfig.shippingRates || []),
                      { name: "", price: 0 },
                    ],
                  });
                }}
              >
                Add Shipping Rate
              </button>

              <h3>Payment Methods</h3>
              {paymentConfig.paymentMethods?.map((method, index) => (
                <div key={index} className="payment-method-form">
                  <input
                    type="text"
                    value={method.name}
                    onChange={(e) => {
                      const newMethods = [...paymentConfig.paymentMethods];
                      newMethods[index].name = e.target.value;
                      setPaymentConfig({
                        ...paymentConfig,
                        paymentMethods: newMethods,
                      });
                    }}
                    placeholder="Method name"
                  />
                  <label>
                    <input
                      type="checkbox"
                      checked={method.isActive}
                      onChange={(e) => {
                        const newMethods = [...paymentConfig.paymentMethods];
                        newMethods[index].isActive = e.target.checked;
                        setPaymentConfig({
                          ...paymentConfig,
                          paymentMethods: newMethods,
                        });
                      }}
                    />
                    Active
                  </label>
                  <button
                    type="button"
                    className="btn-icon remove"
                    onClick={() => {
                      setPaymentConfig({
                        ...paymentConfig,
                        paymentMethods: paymentConfig.paymentMethods.filter(
                          (_, i) => i !== index,
                        ),
                      });
                    }}
                  >
                    ✖
                  </button>
                </div>
              ))}
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setPaymentConfig({
                    ...paymentConfig,
                    paymentMethods: [
                      ...(paymentConfig.paymentMethods || []),
                      { name: "", isActive: true },
                    ],
                  });
                }}
              >
                Add Payment Method
              </button>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowPaymentModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};

export default SuperAdminDashboard;
