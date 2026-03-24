import React, { useState, useEffect, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import api from "../utils/api";
import "../styles/profile.css";
import ProductBoxIcon from "../assets/product-box.svg";
import MoneyIcon from "../assets/money-bag.svg";
import CheckIcon from "../assets/check.svg";
import LockIcon from "../assets/lock-pad.svg";
import ClockIcon from "../assets/clock.svg";
import UserLogoIcon from "../assets/user-logo.svg";
import ShoppingCartIcon from "../assets/shopping-cart.svg";
import SuspiciousIcon from "../assets/suspicious.svg";
import EyeIcon from "../assets/eye-user-details.svg";

const Profile = () => {
  const { user, fetchUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Edit mode states
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    name: "",
    email: "",
    phoneNumber: "",
    address: {
      street: "",
      city: "",
      state: "",
      zipCode: "",
      country: "",
    },
  });

  // Password modal states
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordError, setPasswordError] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Fetch user data
  useEffect(() => {
    const fetchUserData = async () => {
      const token = localStorage.getItem("token");

      // Check if user is already in context (already authenticated)
      if (!token && !user) {
        setError("Please log in to view your profile");
        setLoading(false);
        setTimeout(() => navigate("/login"), 2000);
        return;
      }

      if (!token) {
        setError("Session expired. Redirecting to login...");
        setLoading(false);
        setTimeout(() => navigate("/login"), 2000);
        return;
      }

      try {
        const response = await api.get("/auth/me");
        const userData = response.data;

        setEditData({
          name: userData.name || "",
          email: userData.email || "",
          phoneNumber: userData.phoneNumber || "",
          address: {
            street: userData.address?.street || "",
            city: userData.address?.city || "",
            state: userData.address?.state || "",
            zipCode: userData.address?.zipCode || "",
            country: userData.address?.country || "",
          },
        });
      } catch (err) {
        console.error("Error fetching user:", err);
        if (err.response?.status === 401) {
          setError("Session expired. Redirecting to login...");
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          setTimeout(() => navigate("/login"), 2000);
        } else {
          setError("Failed to fetch user data. Please login again.");
          setTimeout(() => navigate("/login"), 3000);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [navigate, user]);

  // Fetch user orders
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await api.get("/orders/my-orders");
        setOrders(response.data);
      } catch (err) {
        console.error("Error fetching orders:", err);
      } finally {
        setOrdersLoading(false);
      }
    };

    fetchOrders();
  }, []);

  // Calculate order stats
  const calculateStats = () => {
    // Exclude cancelled orders from total orders count
    const activeOrders = orders.filter(
      (order) => order.orderStatus !== "cancelled",
    );
    const totalOrders = activeOrders.length;

    // Only sum totalAmount for non-cancelled orders
    const totalSpent = activeOrders.reduce(
      (sum, order) => sum + order.totalAmount,
      0,
    );

    const pendingOrders = orders.filter(
      (order) =>
        order.orderStatus === "processing" || order.orderStatus === "shipped",
    ).length;

    const completedOrders = orders.filter(
      (order) => order.orderStatus === "delivered",
    ).length;

    return { totalOrders, totalSpent, pendingOrders, completedOrders };
  };

  const stats = calculateStats();

  // Handle edit input changes
  const handleEditChange = (e) => {
    const { name, value } = e.target;
    if (name.includes(".")) {
      const [parent, child] = name.split(".");
      setEditData((prev) => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value,
        },
      }));
    } else {
      setEditData((prev) => ({ ...prev, [name]: value }));
    }
  };

  // Handle profile update
  const handleUpdateProfile = async () => {
    try {
      setError("");
      setSuccessMessage("");

      const response = await api.put("/auth/update-profile", editData);
      setSuccessMessage("Profile updated successfully!");
      setIsEditing(false);

      // Refresh user context
      if (fetchUser) {
        fetchUser();
      }
    } catch (err) {
      setError(err.response?.data?.error || "Failed to update profile");
    }
  };

  // Handle password change
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPasswordError("");

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError("New passwords do not match");
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setPasswordError("Password must be at least 6 characters");
      return;
    }

    try {
      setPasswordLoading(true);
      await api.put("/auth/change-password", {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });

      setSuccessMessage("Password changed successfully!");
      setShowPasswordModal(false);
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (err) {
      setPasswordError(
        err.response?.data?.error || "Failed to change password",
      );
    } finally {
      setPasswordLoading(false);
    }
  };

  // Get order status badge class
  const getStatusClass = (status) => {
    switch (status) {
      case "delivered":
        return "status-delivered";
      case "processing":
        return "status-processing";
      case "shipped":
        return "status-shipped";
      case "cancelled":
        return "status-cancelled";
      default:
        return "status-pending";
    }
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <div className="container">
        {/* Page Header */}
        <div className="profile-header">
          <h1>My Profile</h1>
          <p>Manage your account settings and view your orders</p>
        </div>

        {/* Error and Success Messages */}
        {error && (
          <div className="alert alert-error">
            <span className="alert-icon">
              <img
                src={SuspiciousIcon}
                alt="Error"
                className="alert-icon-svg"
              />
            </span>
            {error}
          </div>
        )}
        {successMessage && (
          <div className="alert alert-success">
            <span className="alert-icon">✓</span>
            {successMessage}
          </div>
        )}

        {/* Account Summary Stats */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">
              <img
                src={ProductBoxIcon}
                alt="Orders"
                className="stat-icon-svg"
              />
            </div>
            <div className="stat-content">
              <h3>{stats.totalOrders}</h3>
              <p>Total Orders</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">
              <img src={MoneyIcon} alt="Spent" className="stat-icon-svg" />
            </div>
            <div className="stat-content">
              <h3>{formatCurrency(stats.totalSpent)}</h3>
              <p>Total Spent</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">
              <img src={ClockIcon} alt="Pending" className="stat-icon-svg" />
            </div>
            <div className="stat-content">
              <h3>{stats.pendingOrders}</h3>
              <p>Pending Orders</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">
              <img src={CheckIcon} alt="Completed" className="stat-icon-svg" />
            </div>
            <div className="stat-content">
              <h3>{stats.completedOrders}</h3>
              <p>Completed Orders</p>
            </div>
          </div>
        </div>

        <div className="profile-content">
          {/* Personal Information Section */}
          <div className="profile-section">
            <div className="section-header">
              <h2>
                <span className="section-icon">
                  <img
                    src={UserLogoIcon}
                    alt="User"
                    className="section-icon-svg"
                  />
                </span>
                Personal Information
              </h2>
              {!isEditing && (
                <button
                  className="btn btn-edit"
                  onClick={() => setIsEditing(true)}
                >
                  {/* <span className="btn-icon">✏️</span> */}
                  Edit
                </button>
              )}
            </div>

            <div className="info-grid">
              <div className="info-card">
                <label>Name</label>
                {isEditing ? (
                  <input
                    type="text"
                    name="name"
                    value={editData.name}
                    onChange={handleEditChange}
                    className="form-input"
                  />
                ) : (
                  <p className="info-value">{user?.name || "N/A"}</p>
                )}
              </div>

              <div className="info-card">
                <label>Email</label>
                {isEditing ? (
                  <input
                    type="email"
                    name="email"
                    value={editData.email}
                    onChange={handleEditChange}
                    className="form-input"
                  />
                ) : (
                  <p className="info-value">{user?.email || "N/A"}</p>
                )}
              </div>

              <div className="info-card">
                <label>Phone Number</label>
                {isEditing ? (
                  <input
                    type="tel"
                    name="phoneNumber"
                    value={editData.phoneNumber}
                    onChange={handleEditChange}
                    className="form-input"
                    placeholder="Enter phone number"
                  />
                ) : (
                  <p className="info-value">
                    {user?.phoneNumber || "Not provided"}
                  </p>
                )}
              </div>

              <div className="info-card">
                <label>Role</label>
                <p className="info-value">
                  <span className={`role-badge role-${user?.role}`}>
                    {user?.role || "user"}
                  </span>
                </p>
              </div>
            </div>

            {/* Address Section */}
            <div className="address-section">
              <h3>Address</h3>
              {isEditing ? (
                <div className="address-grid">
                  <div className="form-group">
                    <label>Street</label>
                    <input
                      type="text"
                      name="address.street"
                      value={editData.address.street}
                      onChange={handleEditChange}
                      className="form-input"
                      placeholder="Street address"
                    />
                  </div>
                  <div className="form-group">
                    <label>City</label>
                    <input
                      type="text"
                      name="address.city"
                      value={editData.address.city}
                      onChange={handleEditChange}
                      className="form-input"
                      placeholder="City"
                    />
                  </div>
                  <div className="form-group">
                    <label>State</label>
                    <input
                      type="text"
                      name="address.state"
                      value={editData.address.state}
                      onChange={handleEditChange}
                      className="form-input"
                      placeholder="State"
                    />
                  </div>
                  <div className="form-group">
                    <label>ZIP Code</label>
                    <input
                      type="text"
                      name="address.zipCode"
                      value={editData.address.zipCode}
                      onChange={handleEditChange}
                      className="form-input"
                      placeholder="ZIP code"
                    />
                  </div>
                  <div className="form-group full-width">
                    <label>Country</label>
                    <input
                      type="text"
                      name="address.country"
                      value={editData.address.country}
                      onChange={handleEditChange}
                      className="form-input"
                      placeholder="Country"
                    />
                  </div>
                </div>
              ) : (
                <div className="address-display">
                  {user?.address ? (
                    <>
                      <p>{user.address.street}</p>
                      <p>
                        {user.address.city}, {user.address.state}{" "}
                        {user.address.zipCode}
                      </p>
                      <p>{user.address.country}</p>
                    </>
                  ) : (
                    <p className="no-address">No address provided</p>
                  )}
                </div>
              )}
            </div>

            {isEditing && (
              <div className="edit-actions">
                <button className="btn btn-save" onClick={handleUpdateProfile}>
                  Save Changes
                </button>
                <button
                  className="btn btn-cancel"
                  onClick={() => {
                    setIsEditing(false);
                    setEditData({
                      name: user?.name || "",
                      email: user?.email || "",
                      phoneNumber: user?.phoneNumber || "",
                      address: {
                        street: user?.address?.street || "",
                        city: user?.address?.city || "",
                        state: user?.address?.state || "",
                        zipCode: user?.address?.zipCode || "",
                        country: user?.address?.country || "",
                      },
                    });
                  }}
                >
                  Cancel
                </button>
              </div>
            )}
          </div>

          {/* Security Section */}
          <div className="profile-section">
            <div className="section-header">
              <h2>
                <span className="section-icon">
                  <img
                    src={LockIcon}
                    alt="Security"
                    className="section-icon-svg"
                  />
                </span>
                Security
              </h2>
            </div>
            <div className="security-content">
              <div className="security-item">
                <div className="security-info">
                  <h4>Password</h4>
                  <p>
                    Change your password regularly to keep your account secure
                  </p>
                </div>
                <button
                  className="btn btn-change-password"
                  onClick={() => setShowPasswordModal(true)}
                >
                  Change Password
                </button>
              </div>
            </div>
          </div>

          {/* Recent Orders Section */}
          <div className="profile-section">
            <div className="section-header">
              <h2>
                <span className="section-icon">
                  <img
                    src={ShoppingCartIcon}
                    alt="Orders"
                    className="section-icon-svg"
                  />
                </span>
                Recent Orders
              </h2>
            </div>

            {ordersLoading ? (
              <div className="loading-orders">
                <div className="loading-spinner"></div>
                <p>Loading orders...</p>
              </div>
            ) : orders.length === 0 ? (
              <div className="no-orders">
                <div className="no-orders-icon">
                  <img
                    src={ProductBoxIcon}
                    alt="No orders"
                    className="no-orders-icon-svg"
                  />
                </div>
                <h3>No orders yet</h3>
                <p>Start shopping to see your orders here!</p>
                <a href="/products" className="btn btn-shop">
                  Browse Products
                </a>
              </div>
            ) : (
              <div className="orders-list">
                {orders.slice(0, 5).map((order) => (
                  <div key={order._id} className="order-card">
                    <div className="order-header">
                      <div className="order-id">
                        <span>Order #{order._id.slice(-8)}</span>
                        <span className="order-date">
                          {formatDate(order.createdAt)}
                        </span>
                      </div>
                      <span
                        className={`order-status ${getStatusClass(order.orderStatus)}`}
                      >
                        {order.orderStatus}
                      </span>
                    </div>
                    <div className="order-body">
                      <div className="order-products">
                        {order.products.map((item, index) => (
                          <div key={index} className="order-product">
                            <img
                              src={
                                item.product?.images?.[0] || "/placeholder.png"
                              }
                              alt={item.product?.name || "Product"}
                              className="product-thumbnail"
                            />
                            <div className="product-details">
                              <p className="product-name">
                                {item.product?.name || "Unknown Product"}
                              </p>
                              <p className="product-quantity">
                                Qty: {item.quantity}
                              </p>
                            </div>
                            <p className="product-price">
                              {formatCurrency(item.price * item.quantity)}
                            </p>
                          </div>
                        ))}
                      </div>
                      <div className="order-footer">
                        <div className="order-total">
                          <span>Total:</span>
                          <span className="total-amount">
                            {formatCurrency(order.totalAmount)}
                          </span>
                        </div>
                        <div className="order-payment">
                          <span>Payment: {order.paymentStatus}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {orders.length > 5 && (
                  <div className="view-all-orders">
                    <a href="/dashboard/user" className="btn btn-view-orders">
                      View All Orders
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowPasswordModal(false)}
        >
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>
                <span className="modal-icon">
                  <img src={LockIcon} alt="Lock" className="modal-icon-svg" />
                </span>
                Change Password
              </h2>
              <button
                className="modal-close"
                onClick={() => setShowPasswordModal(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handlePasswordChange} className="password-form">
              {passwordError && (
                <div className="alert alert-error">
                  <span className="alert-icon">
                    <img
                      src={SuspiciousIcon}
                      alt="Error"
                      className="alert-icon-svg"
                    />
                  </span>
                  {passwordError}
                </div>
              )}

              <div className="form-group">
                <label htmlFor="currentPassword">Current Password</label>
                <div className="password-input-wrapper">
                  <input
                    type={showCurrentPassword ? "text" : "password"}
                    id="currentPassword"
                    value={passwordData.currentPassword}
                    onChange={(e) =>
                      setPasswordData({
                        ...passwordData,
                        currentPassword: e.target.value,
                      })
                    }
                    className="form-input"
                    placeholder="Enter current password"
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    tabIndex="-1"
                  >
                    <img
                      src={EyeIcon}
                      alt={
                        showCurrentPassword ? "Hide password" : "Show password"
                      }
                      className="password-toggle-icon"
                    />
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="newPassword">New Password</label>
                <div className="password-input-wrapper">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    id="newPassword"
                    value={passwordData.newPassword}
                    onChange={(e) =>
                      setPasswordData({
                        ...passwordData,
                        newPassword: e.target.value,
                      })
                    }
                    className="form-input"
                    placeholder="Enter new password"
                    minLength={6}
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    tabIndex="-1"
                  >
                    <img
                      src={EyeIcon}
                      alt={showNewPassword ? "Hide password" : "Show password"}
                      className="password-toggle-icon"
                    />
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm New Password</label>
                <div className="password-input-wrapper">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    id="confirmPassword"
                    value={passwordData.confirmPassword}
                    onChange={(e) =>
                      setPasswordData({
                        ...passwordData,
                        confirmPassword: e.target.value,
                      })
                    }
                    className="form-input"
                    placeholder="Confirm new password"
                    minLength={6}
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    tabIndex="-1"
                  >
                    <img
                      src={EyeIcon}
                      alt={
                        showConfirmPassword ? "Hide password" : "Show password"
                      }
                      className="password-toggle-icon"
                    />
                  </button>
                </div>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-cancel"
                  onClick={() => setShowPasswordModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-save"
                  disabled={passwordLoading}
                >
                  {passwordLoading ? "Changing..." : "Change Password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
