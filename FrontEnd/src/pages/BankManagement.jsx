import React, { useState, useEffect } from "react";
import api from "../utils/api";
import { success, error, confirm } from "../utils/toast.jsx";
import "../styles/bank-management.css";

const BankManagement = () => {
  const [bankAccounts, setBankAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [qrCodeData, setQrCodeData] = useState(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [stats, setStats] = useState(null);

  const [formData, setFormData] = useState({
    accountHolderName: "",
    accountNumber: "",
    ifscCode: "",
    bankName: "",
    branchName: "",
    accountType: "Current",
    upiId: "",
    isPrimary: false,
    isActive: true,
  });

  useEffect(() => {
    fetchBankAccounts();
    fetchStats();
  }, []);

  const fetchBankAccounts = async () => {
    try {
      const response = await api.get("/bank-accounts");
      setBankAccounts(response.data.bankAccounts);
    } catch (err) {
      console.error("Error fetching bank accounts:", err);
      error("Failed to load bank accounts");
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get("/bank-accounts/stats");
      setStats(response.data);
    } catch (err) {
      console.error("Error fetching stats:", err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleAddAccount = async (e) => {
    e.preventDefault();

    try {
      const response = await api.post("/bank-accounts", formData);
      success("Bank account added successfully");
      setShowAddModal(false);
      setFormData({
        accountHolderName: "",
        accountNumber: "",
        ifscCode: "",
        bankName: "",
        branchName: "",
        accountType: "Current",
        upiId: "",
        isPrimary: false,
        isActive: true,
      });
      fetchBankAccounts();
      fetchStats();
    } catch (err) {
      console.error("Error adding bank account:", err);
      error(err.response?.data?.error || "Failed to add bank account");
    }
  };

  const handleToggleStatus = async (id) => {
    try {
      const response = await api.patch(`/bank-accounts/${id}/toggle-status`);
      success(response.data.message);
      fetchBankAccounts();
      fetchStats();
    } catch (err) {
      error("Failed to update status");
    }
  };

  const handleSetPrimary = async (id) => {
    try {
      const response = await api.patch(`/bank-accounts/${id}/set-primary`);
      success(response.data.message);
      fetchBankAccounts();
      fetchStats();
    } catch (err) {
      error("Failed to set primary account");
    }
  };

  const handleDelete = async (id) => {
    confirm("Are you sure you want to delete this bank account?", async () => {
      try {
        await api.delete(`/bank-accounts/${id}`);
        success("Bank account deleted successfully");
        fetchBankAccounts();
        fetchStats();
      } catch (err) {
        error("Failed to delete bank account");
      }
    });
  };

  const handleGenerateQR = async (account) => {
    setSelectedAccount(account);
    setShowQRModal(true);
    setQrLoading(true);

    try {
      const response = await api.get(`/bank-accounts/${account._id}/qr`);
      setQrCodeData(response.data);
    } catch (err) {
      console.error("Error generating QR:", err);
      error("Failed to generate QR code");
    } finally {
      setQrLoading(false);
    }
  };

  const refreshQR = () => {
    if (selectedAccount) {
      handleGenerateQR(selectedAccount);
    }
  };

  if (loading) {
    return (
      <div className="bank-management-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading bank accounts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bank-management-page">
      <div className="bank-header">
        <div className="header-content">
          <h1>Bank Account Management</h1>
          <p>Manage payment receiving accounts for your business</p>
        </div>
        <button className="btn btn-add" onClick={() => setShowAddModal(true)}>
          <span className="btn-icon">+</span>
          Add Bank Account
        </button>
      </div>

      {stats && (
        <div className="bank-stats-grid">
          <div className="stat-card">
            <div className="stat-value">{stats.totalAccounts}</div>
            <div className="stat-label">Total Accounts</div>
          </div>
          <div className="stat-card active">
            <div className="stat-value">{stats.activeAccounts}</div>
            <div className="stat-label">Active Accounts</div>
          </div>
          <div className="stat-card inactive">
            <div className="stat-value">{stats.inactiveAccounts}</div>
            <div className="stat-label">Inactive Accounts</div>
          </div>
          {stats.primaryAccount && (
            <div className="stat-card primary">
              <div className="stat-value">🏆</div>
              <div className="stat-label">
                Primary: {stats.primaryAccount.bankName}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="bank-accounts-grid">
        {bankAccounts.map((account) => (
          <div
            key={account._id}
            className={`bank-account-card ${account.isPrimary ? "primary" : ""} ${!account.isActive ? "inactive" : ""}`}
          >
            <div className="card-header">
              <div className="account-type">
                <span className={`badge ${account.accountType.toLowerCase()}`}>
                  {account.accountType}
                </span>
                {account.isPrimary && (
                  <span className="badge primary">🏆 Primary</span>
                )}
                {!account.isActive && (
                  <span className="badge inactive">⏸️ Inactive</span>
                )}
              </div>
              <div className="card-actions">
                <button
                  className="action-btn qr-btn"
                  onClick={() => handleGenerateQR(account)}
                  title="Generate QR Code"
                >
                  📱
                </button>
                <button
                  className={`action-btn toggle-btn ${account.isActive ? "active" : ""}`}
                  onClick={() => handleToggleStatus(account._id)}
                  title={account.isActive ? "Deactivate" : "Activate"}
                >
                  {account.isActive ? "✓" : "✕"}
                </button>
                {!account.isPrimary && (
                  <button
                    className="action-btn primary-btn"
                    onClick={() => handleSetPrimary(account._id)}
                    title="Set as Primary"
                  >
                    ⭐
                  </button>
                )}
                <button
                  className="action-btn delete-btn"
                  onClick={() => handleDelete(account._id)}
                  title="Delete"
                >
                  🗑️
                </button>
              </div>
            </div>

            <div className="card-body">
              <div className="account-info">
                <div className="info-row">
                  <span className="label">Account Holder:</span>
                  <span className="value">{account.accountHolderName}</span>
                </div>
                <div className="info-row">
                  <span className="label">Account Number:</span>
                  <span className="value">
                    •••• {account.accountNumber.slice(-4)}
                  </span>
                </div>
                <div className="info-row">
                  <span className="label">Bank:</span>
                  <span className="value">{account.bankName}</span>
                </div>
                <div className="info-row">
                  <span className="label">IFSC:</span>
                  <span className="value">{account.ifscCode}</span>
                </div>
                {account.branchName && (
                  <div className="info-row">
                    <span className="label">Branch:</span>
                    <span className="value">{account.branchName}</span>
                  </div>
                )}
                {account.upiId && (
                  <div className="info-row upi">
                    <span className="label">📱 UPI ID:</span>
                    <span className="value">{account.upiId}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="card-footer">
              <span className="added-date">
                Added: {new Date(account.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Add Bank Account Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add New Bank Account</h2>
              <button
                className="modal-close"
                onClick={() => setShowAddModal(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddAccount} className="bank-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Account Holder Name *</label>
                  <input
                    type="text"
                    name="accountHolderName"
                    value={formData.accountHolderName}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter account holder name"
                  />
                </div>
                <div className="form-group">
                  <label>Account Number *</label>
                  <input
                    type="text"
                    name="accountNumber"
                    value={formData.accountNumber}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter account number"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>IFSC Code *</label>
                  <input
                    type="text"
                    name="ifscCode"
                    value={formData.ifscCode}
                    onChange={handleInputChange}
                    required
                    placeholder="e.g., SBIN0001234"
                    uppercase
                  />
                </div>
                <div className="form-group">
                  <label>Bank Name *</label>
                  <input
                    type="text"
                    name="bankName"
                    value={formData.bankName}
                    onChange={handleInputChange}
                    required
                    placeholder="e.g., State Bank of India"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Branch Name</label>
                  <input
                    type="text"
                    name="branchName"
                    value={formData.branchName}
                    onChange={handleInputChange}
                    placeholder="e.g., Main Branch"
                  />
                </div>
                <div className="form-group">
                  <label>Account Type *</label>
                  <select
                    name="accountType"
                    value={formData.accountType}
                    onChange={handleInputChange}
                  >
                    <option value="Current">Current</option>
                    <option value="Savings">Savings</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>UPI ID (for UPI payments)</label>
                <input
                  type="text"
                  name="upiId"
                  value={formData.upiId}
                  onChange={handleInputChange}
                  placeholder="e.g., yourname@upi"
                />
              </div>

              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    name="isPrimary"
                    checked={formData.isPrimary}
                    onChange={handleInputChange}
                  />
                  Set as Primary Account
                </label>
                <label>
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleInputChange}
                  />
                  Active Account
                </label>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-cancel"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-save">
                  Add Bank Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      {showQRModal && (
        <div className="modal-overlay" onClick={() => setShowQRModal(false)}>
          <div
            className="modal-content qr-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2>UPI Payment QR Code</h2>
              <button
                className="modal-close"
                onClick={() => setShowQRModal(false)}
              >
                ✕
              </button>
            </div>

            {qrLoading ? (
              <div className="qr-loading">
                <div className="loading-spinner"></div>
                <p>Generating QR Code...</p>
              </div>
            ) : qrCodeData ? (
              <div className="qr-content">
                <div className="qr-code-container">
                  <img src={qrCodeData.qrCode} alt="UPI QR Code" />
                </div>
                <div className="qr-info">
                  <h3>{selectedAccount?.bankName}</h3>
                  <p className="account-holder">
                    {qrCodeData.accountHolderName}
                  </p>
                  <p className="upi-id">UPI: {qrCodeData.upiId}</p>
                  <p className="txn-ref">
                    Transaction Ref: {qrCodeData.txnRef}
                  </p>
                </div>
                <button className="btn btn-refresh" onClick={refreshQR}>
                  🔄 Refresh QR Code
                </button>
                <p className="qr-note">
                  Scan this QR code with any UPI app (Google Pay, PhonePe,
                  Paytm, BHIM) to make payment
                </p>
              </div>
            ) : (
              <div className="qr-error">
                <p>Failed to generate QR code</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default BankManagement;
