import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../utils/api";
import { success, error } from "../utils/toast.jsx";
import "../styles/payment.css";

const Payment = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("");
  const [bankAccounts, setBankAccounts] = useState([]);
  const [selectedBankAccount, setSelectedBankAccount] = useState(null);
  const [qrCodeData, setQrCodeData] = useState(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState({
    cardNumber: "",
    cardName: "",
    expiryDate: "",
    cvv: "",
    upiId: "",
  });

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const response = await api.get(`/orders/${orderId}`);
        setOrder(response.data);
      } catch (err) {
        console.error("Error fetching order:", err);
        error("Failed to load order details");
        navigate("/orders");
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
    fetchBankAccounts();
  }, [orderId, navigate]);

  const fetchBankAccounts = async () => {
    try {
      const response = await api.get("/bank-accounts/active");
      const activeAccounts = response.data.bankAccounts.filter(
        (acc) => acc.upiId,
      );
      setBankAccounts(activeAccounts);
      if (activeAccounts.length > 0) {
        setSelectedBankAccount(activeAccounts[0]);
      }
    } catch (err) {
      console.error("Error fetching bank accounts:", err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setPaymentDetails((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePayment = async (e) => {
    e.preventDefault();

    if (!paymentMethod) {
      error("Please select a payment method");
      return;
    }

    // Validate payment details based on method
    if (
      paymentMethod === "Card" ||
      paymentMethod === "Credit Card" ||
      paymentMethod === "Debit Card"
    ) {
      if (
        !paymentDetails.cardNumber ||
        !paymentDetails.cardName ||
        !paymentDetails.expiryDate ||
        !paymentDetails.cvv
      ) {
        error("Please fill in all card details");
        return;
      }
    }

    if (paymentMethod === "UPI") {
      if (!paymentDetails.upiId || !paymentDetails.upiId.includes("@")) {
        error("Please enter a valid UPI ID");
        return;
      }
    }

    setProcessing(true);

    try {
      const response = await api.post("/payments/process", {
        orderId,
        paymentMethod,
        paymentDetails,
      });

      if (response.data.paymentResult.success) {
        success("Payment successful!");
        navigate(`/order-confirmation/${orderId}`);
      }
    } catch (err) {
      console.error("Payment error:", err);
      error(err.response?.data?.error || "Payment failed. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  const handleGenerateQR = async () => {
    if (!selectedBankAccount) return;

    setQrLoading(true);
    try {
      const response = await api.get(
        `/bank-accounts/${selectedBankAccount._id}/qr?amount=${order.totalAmount}`,
      );
      setQrCodeData(response.data);
    } catch (err) {
      console.error("Error generating QR:", err);
      error("Failed to generate QR code");
    } finally {
      setQrLoading(false);
    }
  };

  const refreshQR = () => {
    handleGenerateQR();
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="payment-page">
        <div className="container">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading payment details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return null;
  }

  return (
    <div className="payment-page">
      <div className="container">
        <div className="payment-container">
          <div className="payment-form-section">
            <h1>Complete Your Payment</h1>

            <div className="order-summary-mini">
              <h3>Order Summary</h3>
              <div className="summary-row">
                <span>Order ID:</span>
                <span>#{order._id?.slice(-8)}</span>
              </div>
              <div className="summary-row">
                <span>Amount:</span>
                <span className="amount">
                  {formatCurrency(order.totalAmount)}
                </span>
              </div>
            </div>

            <form onSubmit={handlePayment} className="payment-form">
              <div className="form-group">
                <label>Select Payment Method</label>
                <div className="payment-methods-grid">
                  <label
                    className={`payment-method-card ${paymentMethod === "Credit Card" ? "selected" : ""}`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="Credit Card"
                      checked={paymentMethod === "Credit Card"}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                    />
                    <span className="method-icon">💳</span>
                    <span className="method-name">Credit Card</span>
                  </label>

                  <label
                    className={`payment-method-card ${paymentMethod === "Debit Card" ? "selected" : ""}`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="Debit Card"
                      checked={paymentMethod === "Debit Card"}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                    />
                    <span className="method-icon">💳</span>
                    <span className="method-name">Debit Card</span>
                  </label>

                  <label
                    className={`payment-method-card ${paymentMethod === "UPI" ? "selected" : ""}`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="UPI"
                      checked={paymentMethod === "UPI"}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                    />
                    <span className="method-icon">📱</span>
                    <span className="method-name">UPI</span>
                  </label>

                  <label
                    className={`payment-method-card ${paymentMethod === "Net Banking" ? "selected" : ""}`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="Net Banking"
                      checked={paymentMethod === "Net Banking"}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                    />
                    <span className="method-icon">🏦</span>
                    <span className="method-name">Net Banking</span>
                  </label>
                </div>
              </div>

              {(paymentMethod === "Credit Card" ||
                paymentMethod === "Debit Card") && (
                <div className="card-details">
                  <div className="form-group">
                    <label>Card Number</label>
                    <input
                      type="text"
                      name="cardNumber"
                      value={paymentDetails.cardNumber}
                      onChange={handleInputChange}
                      placeholder="1234 5678 9012 3456"
                      maxLength="19"
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label>Cardholder Name</label>
                    <input
                      type="text"
                      name="cardName"
                      value={paymentDetails.cardName}
                      onChange={handleInputChange}
                      placeholder="John Doe"
                      className="form-input"
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Expiry Date</label>
                      <input
                        type="text"
                        name="expiryDate"
                        value={paymentDetails.expiryDate}
                        onChange={handleInputChange}
                        placeholder="MM/YY"
                        maxLength="5"
                        className="form-input"
                      />
                    </div>
                    <div className="form-group">
                      <label>CVV</label>
                      <input
                        type="text"
                        name="cvv"
                        value={paymentDetails.cvv}
                        onChange={handleInputChange}
                        placeholder="123"
                        maxLength="4"
                        className="form-input"
                      />
                    </div>
                  </div>
                </div>
              )}

              {paymentMethod === "UPI" && (
                <div className="upi-details">
                  <div className="bank-account-selector">
                    <label>Select Bank Account</label>
                    <select
                      value={selectedBankAccount?._id || ""}
                      onChange={(e) => {
                        const account = bankAccounts.find(
                          (acc) => acc._id === e.target.value,
                        );
                        setSelectedBankAccount(account);
                        setQrCodeData(null);
                      }}
                      className="form-input"
                    >
                      {bankAccounts.map((account) => (
                        <option key={account._id} value={account._id}>
                          {account.bankName} - {account.accountHolderName}
                        </option>
                      ))}
                    </select>
                  </div>

                  {selectedBankAccount && (
                    <div className="qr-section">
                      <div className="qr-header">
                        <h4>Scan to Pay</h4>
                        <button
                          className="btn-refresh-qr"
                          onClick={refreshQR}
                          title="Refresh QR Code"
                        >
                          🔄
                        </button>
                      </div>

                      {qrLoading ? (
                        <div className="qr-loading-small">
                          <div className="loading-spinner"></div>
                          <p>Generating QR Code...</p>
                        </div>
                      ) : qrCodeData ? (
                        <div className="qr-display">
                          <img src={qrCodeData.qrCode} alt="UPI QR Code" />
                          <div className="qr-details">
                            <p className="bank-name">
                              {qrCodeData.accountHolderName}
                            </p>
                            <p className="upi-id">{qrCodeData.upiId}</p>
                            <p className="amount">
                              Amount: {formatCurrency(order.totalAmount)}
                            </p>
                            <p className="txn-ref">Ref: {qrCodeData.txnRef}</p>
                          </div>
                        </div>
                      ) : (
                        <button
                          className="btn-generate-qr"
                          onClick={handleGenerateQR}
                        >
                          📱 Generate QR Code
                        </button>
                      )}

                      <div className="upi-instructions">
                        <p>
                          <strong>How to pay:</strong>
                        </p>
                        <ol>
                          <li>
                            Open any UPI app (Google Pay, PhonePe, Paytm, BHIM)
                          </li>
                          <li>Scan the QR code or enter UPI ID manually</li>
                          <li>Verify amount and complete payment</li>
                          <li>Click "I Have Paid" button below</li>
                        </ol>
                      </div>
                    </div>
                  )}

                  <div className="form-group">
                    <label>Or Enter Your UPI ID</label>
                    <input
                      type="text"
                      name="upiId"
                      value={paymentDetails.upiId}
                      onChange={handleInputChange}
                      placeholder="yourname@upi"
                      className="form-input"
                    />
                  </div>
                  <div className="upi-apps">
                    <p className="upi-hint">Supported UPI Apps:</p>
                    <div className="upi-app-logos">
                      <span className="upi-app">Google Pay</span>
                      <span className="upi-app">PhonePe</span>
                      <span className="upi-app">Paytm</span>
                      <span className="upi-app">BHIM</span>
                    </div>
                  </div>
                </div>
              )}

              {paymentMethod === "Net Banking" && (
                <div className="netbanking-details">
                  <div className="form-group">
                    <label>Select Bank</label>
                    <select name="bank" className="form-input">
                      <option value="">Choose your bank</option>
                      <option value="hdfc">HDFC Bank</option>
                      <option value="icici">ICICI Bank</option>
                      <option value="sbi">State Bank of India</option>
                      <option value="axis">Axis Bank</option>
                      <option value="kotak">Kotak Mahindra Bank</option>
                      <option value="other">Other Banks</option>
                    </select>
                  </div>
                </div>
              )}

              <button type="submit" className="pay-btn" disabled={processing}>
                {processing
                  ? "Processing..."
                  : `Pay ${formatCurrency(order.totalAmount)}`}
              </button>

              <button
                type="button"
                className="cancel-btn"
                onClick={() => navigate(`/order-confirmation/${orderId}`)}
              >
                Cancel Payment
              </button>
            </form>
          </div>

          <div className="payment-info-sidebar">
            <h3>Secure Payment</h3>
            <div className="security-features">
              <div className="security-item">
                <span className="security-icon">🔒</span>
                <div>
                  <h4>SSL Encrypted</h4>
                  <p>Your data is protected with 256-bit SSL encryption</p>
                </div>
              </div>
              <div className="security-item">
                <span className="security-icon">✅</span>
                <div>
                  <h4>100% Secure</h4>
                  <p>We don't store your card details</p>
                </div>
              </div>
              <div className="security-item">
                <span className="security-icon">🛡️</span>
                <div>
                  <h4>Fraud Protection</h4>
                  <p>Advanced fraud detection and prevention</p>
                </div>
              </div>
            </div>

            <div className="need-help">
              <h4>Need Help?</h4>
              <p>Call us at: +91 1234567890</p>
              <p>Email: support@dairy.com</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Payment;
