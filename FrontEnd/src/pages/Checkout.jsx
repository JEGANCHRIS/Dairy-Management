import React, { useState, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { CartContext } from "../context/CartContext";
import { AuthContext } from "../context/AuthContext";
import api from "../utils/api";
import { error, success } from "../utils/toast.jsx";
import { getDeliveryInfo } from "../utils/pincodeUtils";
import BulbIcon from "../assets/bulb.svg";
import TruckIcon from "../assets/delivery-truck.svg";
import "../styles/checkout.css";

const Checkout = () => {
  const { cartItems, getCartTotal, clearCart } = useContext(CartContext);
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState([]);

  const [pincodeInput, setPincodeInput] = useState(
    user?.address?.zipCode || "",
  );
  const [deliveryInfo, setDeliveryInfo] = useState(null);
  const [pincodeError, setPincodeError] = useState("");
  const [selectedDelivery, setSelectedDelivery] = useState(null);

  const [formData, setFormData] = useState({
    shippingAddress: {
      street: user?.address?.street || "",
      city: user?.address?.city || "",
      state: user?.address?.state || "",
      zipCode: user?.address?.zipCode || "",
      country: user?.address?.country || "India",
    },
    paymentMethod: "",
    notes: "",
  });

  useEffect(() => {
    if (cartItems.length === 0) navigate("/cart");
  }, [cartItems, navigate]);
  useEffect(() => {
    fetchPaymentMethods();
  }, []);
  useEffect(() => {
    if (user?.address?.zipCode) checkPincode(user.address.zipCode);
  }, []);

  const fetchPaymentMethods = async () => {
    try {
      const res = await api.get("/payments/methods");
      setPaymentMethods(res.data.paymentMethods);
    } catch (err) {
      console.error(err);
    }
  };

  const checkPincode = (pin) => {
    const cleaned = String(pin).trim();
    if (!/^\d{6}$/.test(cleaned)) {
      setPincodeError("Please enter a valid 6-digit pincode");
      setDeliveryInfo(null);
      setSelectedDelivery(null);
      return;
    }
    const info = getDeliveryInfo(cleaned);
    if (!info.valid) {
      setPincodeError("Pincode not recognised. Please check and try again.");
      setDeliveryInfo(null);
      setSelectedDelivery(null);
    } else {
      setPincodeError("");
      setDeliveryInfo(info);
      setSelectedDelivery("standard");
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith("shipping.")) {
      const field = name.split(".")[1];
      if (field === "zipCode") {
        setPincodeInput(value);
        if (value.length === 6) checkPincode(value);
        else {
          setDeliveryInfo(null);
          setSelectedDelivery(null);
          setPincodeError("");
        }
      }
      setFormData((prev) => ({
        ...prev,
        shippingAddress: { ...prev.shippingAddress, [field]: value },
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const canProceedToPayment = () => {
    const { street, city, state, zipCode } = formData.shippingAddress;
    return (
      street && city && state && zipCode && deliveryInfo && selectedDelivery
    );
  };

  const handlePlaceOrder = async () => {
    try {
      setLoading(true);

      console.log("🛒 Cart items:", cartItems);
      console.log("📦 Form data:", formData);
      console.log("🚚 Selected delivery:", selectedDelivery);
      console.log("💰 Delivery info:", deliveryInfo);

      if (!cartItems || cartItems.length === 0) {
        error("Your cart is empty");
        setLoading(false);
        return;
      }

      if (!formData.paymentMethod) {
        error("Please select a payment method");
        setLoading(false);
        return;
      }

      const deliveryCharge =
        selectedDelivery === "express"
          ? deliveryInfo.express.charge
          : deliveryInfo.standard.charge;

      const orderData = {
        products: cartItems.map((item) => ({
          productId: item._id,
          quantity: item.quantity,
        })),
        shippingAddress: formData.shippingAddress,
        paymentMethod: formData.paymentMethod,
        notes: formData.notes,
        deliveryType: selectedDelivery,
        deliveryCharge,
      };

      console.log("📤 Sending order data:", orderData);

      const response = await api.post("/orders", orderData);

      console.log("✅ Order created successfully:", response.data);

      // For Cash on Delivery, go directly to confirmation
      if (formData.paymentMethod === "Cash on Delivery") {
        clearCart();
        navigate(`/order-confirmation/${response.data.order._id}`);
      } else {
        // For online payments, redirect to payment page
        navigate(`/payment/${response.data.order._id}`);
      }
    } catch (err) {
      console.error("❌ Error placing order:", err);
      console.error("❌ Error response:", err.response?.data);
      console.error("❌ Error status:", err.response?.status);

      const errorMessage =
        err.response?.data?.error || "Error placing order. Please try again.";
      error(errorMessage);

      // Don't clear cart on error
      setLoading(false);
    }
  };

  const subtotal = getCartTotal();
  const deliveryCharge =
    deliveryInfo && selectedDelivery
      ? selectedDelivery === "express"
        ? deliveryInfo.express.charge
        : deliveryInfo.standard.charge
      : 0;
  const total = subtotal + deliveryCharge;

  return (
    <section className="checkout-page">
      <div className="container">
        <h1>Checkout</h1>

        <div className="checkout-steps">
          {["Shipping", "Payment", "Review"].map((label, i) => (
            <div
              key={label}
              className={`step ${step >= i + 1 ? "active" : ""}`}
            >
              <span className="step-number">{i + 1}</span>
              <span className="step-label">{label}</span>
            </div>
          ))}
        </div>

        <div className="checkout-container">
          <div className="checkout-form">
            {step === 1 && (
              <div className="shipping-form">
                <h2>Shipping Address</h2>

                <div className="form-group">
                  <label>Street Address *</label>
                  <input
                    type="text"
                    name="shipping.street"
                    value={formData.shippingAddress.street}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>City *</label>
                    <input
                      type="text"
                      name="shipping.city"
                      value={formData.shippingAddress.city}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>State *</label>
                    <input
                      type="text"
                      name="shipping.state"
                      value={formData.shippingAddress.state}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>PIN Code *</label>
                    <div className="pincode-input-row">
                      <input
                        type="text"
                        name="shipping.zipCode"
                        value={formData.shippingAddress.zipCode}
                        onChange={handleInputChange}
                        maxLength={6}
                        placeholder="6-digit PIN code"
                        required
                      />
                      <button
                        type="button"
                        className="pincode-check-btn"
                        onClick={() =>
                          checkPincode(formData.shippingAddress.zipCode)
                        }
                      >
                        Check
                      </button>
                    </div>
                    {pincodeError && (
                      <span className="pincode-error">{pincodeError}</span>
                    )}
                    {deliveryInfo && (
                      <span className="pincode-zone-tag">
                        <img
                          src={TruckIcon}
                          alt="Location"
                          className="inline-icon"
                        />
                        {deliveryInfo.zoneName} — {deliveryInfo.zoneDescription}
                      </span>
                    )}
                  </div>
                  <div className="form-group">
                    <label>Country *</label>
                    <input
                      type="text"
                      name="shipping.country"
                      value={formData.shippingAddress.country}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>

                {deliveryInfo && (
                  <div className="delivery-options">
                    <h3 className="delivery-options-title">
                      Choose Delivery Type
                    </h3>
                    <div className="delivery-cards">
                      <label
                        className={`delivery-card ${selectedDelivery === "standard" ? "selected" : ""}`}
                      >
                        <input
                          type="radio"
                          name="deliveryType"
                          value="standard"
                          checked={selectedDelivery === "standard"}
                          onChange={() => setSelectedDelivery("standard")}
                        />
                        <div className="delivery-card-body">
                          <div className="delivery-card-top">
                            <span className="delivery-type-name">
                              <img
                                src={TruckIcon}
                                alt="Truck"
                                className="inline-icon"
                              />{" "}
                              Standard Delivery
                            </span>
                            <span className="delivery-charge">
                              {deliveryInfo.standard.charge === 0
                                ? "Free"
                                : `₹${deliveryInfo.standard.charge}`}
                            </span>
                          </div>
                          <span className="delivery-days">
                            {deliveryInfo.standard.days}
                          </span>
                        </div>
                      </label>

                      <label
                        className={`delivery-card ${selectedDelivery === "express" ? "selected" : ""}`}
                      >
                        <input
                          type="radio"
                          name="deliveryType"
                          value="express"
                          checked={selectedDelivery === "express"}
                          onChange={() => setSelectedDelivery("express")}
                        />
                        <div className="delivery-card-body">
                          <div className="delivery-card-top">
                            <span className="delivery-type-name">
                              <img
                                src={TruckIcon}
                                alt="Express Truck"
                                className="inline-icon express-icon"
                              />{" "}
                              Express Delivery
                            </span>
                            <span className="delivery-charge express">
                              ₹{deliveryInfo.express.charge}
                            </span>
                          </div>
                          <span className="delivery-days">
                            {deliveryInfo.express.days}
                          </span>
                        </div>
                      </label>
                    </div>
                  </div>
                )}

                {!deliveryInfo && (
                  <p className="pincode-hint">
                    <img src={BulbIcon} alt="Hint" className="inline-icon" />
                    Enter your PIN code above to see delivery options and
                    charges for your area.
                  </p>
                )}

                <div className="form-group">
                  <label>Order Notes (Optional)</label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    rows="3"
                    placeholder="Any special instructions for delivery?"
                  />
                </div>

                <button
                  className="btn btn-primary"
                  onClick={() => setStep(2)}
                  disabled={!canProceedToPayment()}
                >
                  Continue to Payment
                </button>
                {!canProceedToPayment() && (
                  <p className="step-hint">
                    {!deliveryInfo
                      ? "⚠ Enter and check your PIN code to continue"
                      : "⚠ Please fill all required fields"}
                  </p>
                )}
              </div>
            )}

            {step === 2 && (
              <div className="payment-form">
                <h2>Payment Method</h2>
                <div className="payment-methods">
                  {paymentMethods.map((method) => (
                    <label key={method.name} className="payment-method">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value={method.name}
                        checked={formData.paymentMethod === method.name}
                        onChange={handleInputChange}
                      />
                      <span className="payment-method-label">
                        {method.name}
                      </span>
                    </label>
                  ))}
                </div>
                <div className="form-actions">
                  <button
                    className="btn btn-secondary"
                    onClick={() => setStep(1)}
                  >
                    Back
                  </button>
                  <button
                    className="btn btn-primary"
                    onClick={() => setStep(3)}
                    disabled={!formData.paymentMethod}
                  >
                    Review Order
                  </button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="review-order">
                <h2>Review Your Order</h2>

                <div className="review-section">
                  <h3>Shipping Address</h3>
                  <p>
                    {formData.shippingAddress.street}
                    <br />
                    {formData.shippingAddress.city},{" "}
                    {formData.shippingAddress.state}{" "}
                    {formData.shippingAddress.zipCode}
                    <br />
                    {formData.shippingAddress.country}
                  </p>
                  <button className="edit-btn" onClick={() => setStep(1)}>
                    Edit
                  </button>
                </div>

                <div className="review-section">
                  <h3>Delivery</h3>
                  <p>
                    {selectedDelivery === "express" ? (
                      <>
                        <img
                          src={TruckIcon}
                          alt="Express"
                          className="inline-icon express-icon"
                        />{" "}
                        Express Delivery
                      </>
                    ) : (
                      <>
                        <img
                          src={TruckIcon}
                          alt="Standard"
                          className="inline-icon"
                        />{" "}
                        Standard Delivery
                      </>
                    )}
                    <br />
                    <span style={{ color: "#7f8c8d", fontSize: "0.9rem" }}>
                      {deliveryInfo
                        ? selectedDelivery === "express"
                          ? deliveryInfo.express.days
                          : deliveryInfo.standard.days
                        : ""}
                      &nbsp;·&nbsp;Zone: {deliveryInfo?.zoneName}
                    </span>
                  </p>
                  <button className="edit-btn" onClick={() => setStep(1)}>
                    Edit
                  </button>
                </div>

                <div className="review-section">
                  <h3>Payment Method</h3>
                  <p>{formData.paymentMethod}</p>
                  <button className="edit-btn" onClick={() => setStep(2)}>
                    Edit
                  </button>
                </div>

                <div className="review-section">
                  <h3>Order Items</h3>
                  <div className="review-items">
                    {cartItems.map((item) => (
                      <div key={item._id} className="review-item">
                        <span className="item-name">
                          {item.name} × {item.quantity}
                        </span>
                        <span className="item-price">
                          ₹{(item.price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="order-summary">
                  <div className="summary-row">
                    <span>Subtotal</span>
                    <span>₹{subtotal.toFixed(2)}</span>
                  </div>
                  <div className="summary-row">
                    <span>
                      {selectedDelivery === "express" ? (
                        <>
                          <img
                            src={TruckIcon}
                            alt="Express"
                            className="inline-icon express-icon"
                          />{" "}
                          Express delivery
                        </>
                      ) : (
                        <>
                          <img
                            src={TruckIcon}
                            alt="Standard"
                            className="inline-icon"
                          />{" "}
                          Standard delivery
                        </>
                      )}
                    </span>
                    <span>
                      {deliveryCharge === 0 ? "Free" : `₹${deliveryCharge}`}
                    </span>
                  </div>
                  <div className="summary-row total">
                    <span>Total</span>
                    <span>₹{total.toFixed(2)}</span>
                  </div>
                </div>

                <button
                  className="btn btn-success place-order-btn"
                  onClick={handlePlaceOrder}
                  disabled={loading}
                >
                  {loading ? "Processing…" : "Place Order"}
                </button>
              </div>
            )}
          </div>

          <div className="order-summary-sidebar">
            <h3>Order Summary</h3>
            <div className="summary-items">
              {cartItems.map((item) => (
                <div key={item._id} className="summary-item">
                  <span className="item-name">{item.name}</span>
                  <span className="item-quantity">×{item.quantity}</span>
                  <span className="item-price">
                    ₹{(item.price * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
            <div className="summary-totals">
              <div className="summary-row">
                <span>Subtotal</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="summary-row">
                <span>Delivery</span>
                <span>
                  {deliveryInfo && selectedDelivery
                    ? deliveryCharge === 0
                      ? "Free"
                      : `₹${deliveryCharge}`
                    : "—"}
                </span>
              </div>
              {deliveryInfo && selectedDelivery && (
                <div className="summary-row">
                  <span style={{ fontSize: "0.8rem", color: "#7f8c8d" }}>
                    {selectedDelivery === "express" ? (
                      <>
                        <img
                          src={TruckIcon}
                          alt="Express"
                          className="inline-icon express-icon"
                        />{" "}
                        Express
                      </>
                    ) : (
                      <>
                        <img
                          src={TruckIcon}
                          alt="Standard"
                          className="inline-icon"
                        />{" "}
                        Standard
                      </>
                    )}{" "}
                    ·{" "}
                    {selectedDelivery === "express"
                      ? deliveryInfo.express.days
                      : deliveryInfo.standard.days}
                  </span>
                </div>
              )}
              <div className="summary-row total">
                <span>Total</span>
                <span>₹{total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Checkout;
