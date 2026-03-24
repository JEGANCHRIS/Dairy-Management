import React, { useState, useEffect, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import api from "../../utils/api";
import { error, success, confirm } from "../../utils/toast.jsx";
import "../../styles/dashboard.css";
import AdminProducts from "../../pages/AdminProducts";
import AnalyticsTabs from "../../components/AnalyticsTabs";
import AIAdminBot from "../../components/AIAdmin/AIAdminBot";
import AuditLog from "../../components/AIAdmin/AuditLog";
import BotIcon from "../../assets/bot.svg";
import SettingsIcon from "../../assets/settings.svg";
import UsersIcon from "../../assets/users-logo.svg";
import ProductBoxIcon from "../../assets/product-box.svg";
import OrdersIcon from "../../assets/orders.svg";
import MoneyIcon from "../../assets/money-bag.svg";
import CheckIcon from "../../assets/check.svg";
import CrossMarkIcon from "../../assets/cross-mark.svg";
import PaymentCardIcon from "../../assets/payment-card.svg";
import PieChartIcon from "../../assets/pie-chart.svg";

const AdminDashboard = () => {
  const { user, loading: authLoading } = useContext(AuthContext);
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [products, setProducts] = useState([]);
  const [blogs, setBlogs] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [showProductModal, setShowProductModal] = useState(false);
  const [showBlogModal, setShowBlogModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [editingBlog, setEditingBlog] = useState(null);
  const [productSearch, setProductSearch] = useState("");
  const [productCategoryFilter, setProductCategoryFilter] = useState("all");
  const [paymentConfig, setPaymentConfig] = useState(null);
  const [auditLogs, setAuditLogs] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [userAnalytics, setUserAnalytics] = useState(null);
  const [productAnalytics, setProductAnalytics] = useState(null);

  const [productForm, setProductForm] = useState({
    name: "",
    category: "milk",
    variety: "",
    description: "",
    price: "",
    stock: "",
    images: [""],
    videoUrl: "",
    nutritionalInfo: {
      calories: "",
      protein: "",
      fat: "",
      calcium: "",
    },
  });

  const [blogForm, setBlogForm] = useState({
    title: "",
    content: "",
    excerpt: "",
    image: "",
    tags: [],
  });

  useEffect(() => {
    // Check if user is authenticated before fetching data
    if (!authLoading && !user) {
      console.warn("⚠️ No user authenticated, redirecting to login...");
      navigate("/login", { replace: true });
      return;
    }

    if (user) {
      console.log("✅ Authenticated user:", user.name, user.role);
      fetchAllData();
    }
  }, [user, authLoading]);

  const fetchAllData = async () => {
    try {
      setLoading(true);

      console.log("📊 Fetching dashboard data...");
      console.log(
        "🔑 Token:",
        localStorage.getItem("token") ? "EXISTS" : "MISSING",
      );

      const [
        statsRes,
        productsRes,
        blogsRes,
        ordersRes,
        paymentRes,
        auditRes,
        userRes,
        productAnalRes,
      ] = await Promise.all([
        api.get("/admin/dashboard/stats").catch((err) => {
          console.error(
            "❌ Stats API error:",
            err.response?.status,
            err.response?.data || err.message,
          );
          return { data: null };
        }),
        api.get("/products").catch((err) => {
          console.error(
            "❌ Products API error:",
            err.response?.status,
            err.response?.data || err.message,
          );
          return { data: { products: [] } };
        }),
        api.get("/blogs").catch((err) => {
          console.error(
            "❌ Blogs API error:",
            err.response?.status,
            err.response?.data || err.message,
          );
          return { data: { blogs: [] } };
        }),
        api.get("/orders?limit=5").catch((err) => {
          console.error(
            "❌ Orders API error:",
            err.response?.status,
            err.response?.data || err.message,
          );
          return { data: { orders: [] } };
        }),
        api.get("/payments/config").catch((err) => {
          console.error(
            "❌ Payment config API error:",
            err.response?.status,
            err.response?.data || err.message,
          );
          return { data: null };
        }),
        api.get("/admin/audit-logs").catch((err) => {
          console.error(
            "❌ Audit logs API error:",
            err.response?.status,
            err.response?.data || err.message,
          );
          return { data: null };
        }),
        api.get("/admin/analytics/users").catch(() => ({ data: null })),
        api.get("/admin/analytics/products").catch(() => ({ data: null })),
      ]);

      console.log("📊 Stats Response Status:", statsRes.status);
      console.log("📊 Stats Data:", statsRes.data);
      console.log("📊 Products Stats:", statsRes.data?.products);
      console.log("📦 Products:", productsRes.data?.products?.length || 0);
      console.log("📝 Blogs:", blogsRes.data?.blogs?.length || 0);
      console.log("📋 Orders:", ordersRes.data?.orders?.length || 0);
      console.log("📋 Audit Logs:", auditRes.data);

      // Set stats from API response
      setStats(
        statsRes.data || {
          users: { total: 0, newToday: 0 },
          products: { total: 0, outOfStock: 0, lowStock: 0 },
          orders: { total: 0, completedOrders: 0, pending: 0 },
          revenue: { thisMonth: 0, today: 0 },
        },
      );

      console.log("✅ Stats set to:", statsRes.data);
      console.log(
        "✅ Out of stock products:",
        statsRes.data?.products?.outOfStock,
      );

      setProducts(productsRes.data?.products || []);
      setBlogs(blogsRes.data?.blogs || []);
      setRecentOrders(ordersRes.data?.orders || []);
      setPaymentConfig(paymentRes.data || null);
      setAuditLogs(auditRes.data || null);
      setUserAnalytics(userRes.data || null);
      setProductAnalytics(productAnalRes.data || null);
    } catch (error) {
      console.error("❌ Error fetching data:", error);
      // Set default empty state
      setStats({
        users: { total: 0, newToday: 0 },
        products: { total: 0, outOfStock: 0 },
        orders: { total: 0, completedOrders: 0 },
        revenue: { thisMonth: 0 },
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name
      .toLowerCase()
      .includes(productSearch.toLowerCase());
    const matchesCategory =
      productCategoryFilter === "all" ||
      product.category === productCategoryFilter;
    return matchesSearch && matchesCategory;
  });

  const categories = [
    { value: "all", label: "All Categories" },
    { value: "milk", label: "Milk" },
    { value: "butter", label: "Butter" },
    { value: "cheese", label: "Cheese" },
    { value: "yogurt", label: "Yogurt" },
    { value: "paneer", label: "Paneer" },
    { value: "lassi", label: "Lassi" },
    { value: "milkshake", label: "Milkshake" },
    { value: "curd", label: "Curd" },
    { value: "cream", label: "Cream" },
    { value: "other", label: "Other" },
  ];

  const handleProductSubmit = async (e) => {
    try {
      if (editingProduct) {
        await api.put(`/products/${editingProduct._id}`, productForm);
      } else {
        await api.post("/products", productForm);
      }
      setShowProductModal(false);
      resetProductForm();
      fetchData();
    } catch (error) {
      console.error("Error saving product:", error);
      error("Error saving product");
    }
  };

  const handleBlogSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingBlog) {
        await api.put(`/blogs/${editingBlog._id}`, blogForm);
      } else {
        await api.post("/blogs", blogForm);
      }
      setShowBlogModal(false);
      resetBlogForm();
      fetchData();
    } catch (error) {
      console.error("Error saving blog:", error);
      error("Error saving blog");
    }
  };

  const handleDeleteProduct = async (id) => {
    confirm("Are you sure you want to delete this product?", async () => {
      try {
        await api.delete(`/products/${id}`);
        success("Product deleted successfully");
        fetchData();
      } catch (error) {
        error("Error deleting product");
      }
    });
  };

  const handleDeleteBlog = async (id) => {
    confirm("Are you sure you want to delete this blog?", async () => {
      try {
        await api.delete(`/blogs/${id}`);
        success("Blog deleted successfully");
        fetchData();
      } catch (error) {
        error("Error deleting blog");
      }
    });
  };

  const resetProductForm = () => {
    setProductForm({
      name: "",
      category: "milk",
      variety: "",
      description: "",
      price: "",
      stock: "",
      images: [""],
      videoUrl: "",
      nutritionalInfo: {
        calories: "",
        protein: "",
        fat: "",
        calcium: "",
      },
    });
    setEditingProduct(null);
  };

  const resetBlogForm = () => {
    setBlogForm({
      title: "",
      content: "",
      excerpt: "",
      image: "",
      tags: [],
    });
    setEditingBlog(null);
  };

  return (
    <section className="dashboard admin-dashboard">
      <div className="container">
        <h1>Admin Dashboard</h1>

        <div className="dashboard-tabs">
          <button
            className={`tab-btn ${activeTab === "overview" ? "active" : ""}`}
            onClick={() => setActiveTab("overview")}
          >
            Overview
          </button>
          <button
            className={`tab-btn ${activeTab === "products" ? "active" : ""}`}
            onClick={() => setActiveTab("products")}
          >
            Manage Products
          </button>
          <button
            className={`tab-btn ${activeTab === "blogs" ? "active" : ""}`}
            onClick={() => setActiveTab("blogs")}
          >
            Manage Blogs
          </button>
          <button
            className={`tab-btn ${activeTab === "payments" ? "active" : ""}`}
            onClick={() => setActiveTab("payments")}
          >
            Payment Config
          </button>
          <button
            className={`tab-btn ${activeTab === "audit" ? "active" : ""}`}
            onClick={() => setActiveTab("audit")}
          >
            Audit Logs
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
            className={`tab-btn ai-tab ${activeTab === "ai-audit" ? "active" : ""}`}
            onClick={() => setActiveTab("ai-audit")}
          >
            <img src={SettingsIcon} alt="Audit" className="tab-icon-svg" /> AI
            Audit
          </button>
        </div>

        {activeTab === "overview" && (
          <>
            {loading ? (
              <div className="loading">Loading dashboard...</div>
            ) : stats ? (
              <>
                <div className="stats-grid">
                  <div className="stat-card">
                    <div className="stat-icon">
                      <img
                        src={UsersIcon}
                        alt="Users"
                        className="stat-icon-svg"
                      />
                    </div>
                    <h3>Total Users</h3>
                    <div className="stat-number">
                      {stats?.users?.total || 0}
                    </div>
                    <div className="stat-change positive">
                      +{stats?.users?.newToday || 0} today
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
                    <div className="stat-number">
                      {stats?.products?.total || 0}
                    </div>
                    <div className="stat-change positive">
                      {stats?.products?.totalStock || 0} units in stock
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
                    <div className="stat-number">
                      {stats?.orders?.total || 0}
                    </div>
                    <div className="stat-change positive">
                      {stats?.orders?.completedOrders || 0} completed
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
                      ₹{(stats?.revenue?.thisMonth || 0).toFixed(2)}
                    </div>
                    <div className="stat-change positive">This month</div>
                  </div>
                </div>

                <div className="quick-links">
                  <h3>Quick Actions</h3>
                  <div className="links-grid">
                    <a href="/admin/products" className="quick-link">
                      <span className="link-icon">
                        <img
                          src={ProductBoxIcon}
                          alt="Products"
                          className="link-icon-svg"
                        />
                      </span>
                      Manage Products
                    </a>
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
                    <Link to="/blogs" className="quick-link">
                      <span className="link-icon">
                        <img
                          src={PieChartIcon}
                          alt="Blogs"
                          className="link-icon-svg"
                        />
                      </span>
                      Manage Blogs
                    </Link>
                    <Link to="/profile" className="quick-link">
                      <span className="link-icon">
                        <img
                          src={UsersIcon}
                          alt="Profile"
                          className="link-icon-svg"
                        />
                      </span>
                      My Profile
                    </Link>
                  </div>
                </div>

                {/* <div className="quick-actions">
              <h3>Product Management</h3>
              <div className="actions-grid">
                <button
                  className="quick-action-card"
                  onClick={() => {
                    resetProductForm();
                    setShowProductModal(true);
                  }}
                >
                  <div className="quick-action-icon">➕</div>
                  <h4>Add New Product</h4>
                  <p>Create a new product</p>
                </button>
                <a href="/admin/products" className="quick-action-card">
                  <div className="quick-action-icon">✏️</div>
                  <h4>Manage Products</h4>
                  <p>Edit and manage all products</p>
                </a>
                <a href="/admin/products" className="quick-action-card">
                  <div className="quick-action-icon">📊</div>
                  <h4>View Inventory</h4>
                  <p>Check stock levels</p>
                </a>
              </div>
            </div> */}

                {/* Recent Orders Section */}
                <div className="recent-orders">
                  <div className="section-header">
                    <h2>
                      <img
                        src={OrdersIcon}
                        alt="Orders"
                        className="section-icon-svg"
                      />{" "}
                      Recent Orders
                    </h2>
                    <Link to="/admin/orders" className="view-all-link">
                      View All →
                    </Link>
                  </div>
                  {recentOrders.length > 0 ? (
                    <div className="orders-table">
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>Order ID</th>
                            <th>Customer</th>
                            <th>Amount</th>
                            <th>Status</th>
                            <th>Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {recentOrders.map((order) => (
                            <tr key={order._id}>
                              <td>#{order._id.slice(-6)}</td>
                              <td>{order.user?.name || "N/A"}</td>
                              <td>₹{order.totalAmount}</td>
                              <td>
                                <span
                                  className={`status-badge status-${order.orderStatus}`}
                                >
                                  {order.orderStatus}
                                </span>
                              </td>
                              <td>
                                {new Date(order.createdAt).toLocaleDateString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="no-data">No recent orders</div>
                  )}
                </div>

                {/* Low Stock Alert Section */}
                <div className="low-stock-alert">
                  <div className="section-header">
                    <h2>⚠️ Low Stock Alert</h2>
                    <Link to="/admin/products" className="view-all-link">
                      Manage Products →
                    </Link>
                  </div>
                  {products.filter((p) => p.stock < 10).length > 0 ? (
                    <div className="stock-grid">
                      {products
                        .filter((p) => p.stock < 10)
                        .slice(0, 5)
                        .map((product) => (
                          <div key={product._id} className="stock-card">
                            <div className="stock-info">
                              <h4>{product.name}</h4>
                              <p className="stock-count">
                                <span
                                  className={`badge ${product.stock === 0 ? "out" : product.stock < 5 ? "critical" : "low"}`}
                                >
                                  {product.stock === 0
                                    ? "Out of Stock"
                                    : `${product.stock} left`}
                                </span>
                              </p>
                            </div>
                            <div className="stock-bar">
                              <div
                                className={`stock-level ${product.stock === 0 ? "empty" : product.stock < 5 ? "critical" : "low"}`}
                                style={{
                                  width: `${Math.min((product.stock / 50) * 100, 100)}%`,
                                }}
                              ></div>
                            </div>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <div className="no-data">
                      <img
                        src={CheckIcon}
                        alt="OK"
                        className="no-data-icon-svg"
                      />{" "}
                      All products well stocked!
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="no-data">
                <p>No dashboard data available</p>
                <p>Please ensure products and orders exist in the system</p>
              </div>
            )}
          </>
        )}

        {activeTab === "products" && <AdminProducts />}

        {activeTab === "blogs" && (
          <div className="blog-management">
            <div className="section-header">
              <h2>Blogs</h2>
              <button
                className="btn btn-primary"
                onClick={() => {
                  resetBlogForm();
                  setShowBlogModal(true);
                }}
              >
                Create New Blog
              </button>
            </div>

            {loading ? (
              <div className="loading">Loading blogs...</div>
            ) : (
              <div className="blogs-list">
                {blogs.map((blog) => (
                  <div key={blog._id} className="blog-card">
                    <img src={blog.image} alt={blog.title} />
                    <div className="blog-info">
                      <h4>{blog.title}</h4>
                      <div className="blog-meta">
                        <span>By {blog.author?.name}</span>
                        <span>
                          {new Date(blog.createdAt).toLocaleDateString()}
                        </span>
                        <span>
                          <img
                            src={CheckIcon}
                            alt="Views"
                            className="blog-icon-svg"
                          />{" "}
                          {blog.views} views
                        </span>
                      </div>
                      <p className="blog-excerpt">{blog.excerpt}</p>
                      <div className="blog-actions">
                        <button
                          className="btn-icon edit"
                          onClick={() => {
                            setEditingBlog(blog);
                            setBlogForm(blog);
                            setShowBlogModal(true);
                          }}
                        >
                          <img
                            src={CheckIcon}
                            alt="Edit"
                            className="btn-icon-svg-small"
                          />{" "}
                          Edit
                        </button>
                        <button
                          className="btn-icon delete"
                          onClick={() => handleDeleteBlog(blog._id)}
                        >
                          <img
                            src={CrossMarkIcon}
                            alt="Delete"
                            className="btn-icon-svg-small"
                          />{" "}
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "payments" && (
          <div className="payment-config">
            <div className="section-header">
              <h2>
                <img
                  src={PaymentCardIcon}
                  alt="Payment"
                  className="section-icon-svg"
                />{" "}
                Payment Configuration
              </h2>
              <button
                className="btn btn-primary"
                onClick={() => setShowPaymentModal(true)}
              >
                Edit Configuration
              </button>
            </div>

            {loading ? (
              <div className="loading">Loading payment configuration...</div>
            ) : paymentConfig ? (
              <>
                <div className="config-section">
                  <h3>Currency</h3>
                  <p>{paymentConfig.currency || "INR"}</p>
                </div>

                <div className="config-section">
                  <h3>Tax Rate</h3>
                  <p>{paymentConfig.taxRate || 0}%</p>
                </div>

                <div className="config-section">
                  <h3>Shipping Rates</h3>
                  {paymentConfig.shippingRates &&
                  paymentConfig.shippingRates.length > 0 ? (
                    <div className="shipping-rates-list">
                      {paymentConfig.shippingRates.map((rate, index) => (
                        <div key={index} className="shipping-rate">
                          <span className="rate-name">{rate.name}</span>
                          <span className="rate-price">₹{rate.price}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="no-data">No shipping rates configured</p>
                  )}
                </div>

                <div className="config-section">
                  <h3>Payment Methods</h3>
                  {paymentConfig.paymentMethods &&
                  paymentConfig.paymentMethods.length > 0 ? (
                    <div className="payment-methods-list">
                      {paymentConfig.paymentMethods.map((method, index) => (
                        <div
                          key={index}
                          className={`payment-method ${method.isActive ? "active" : ""}`}
                        >
                          <div className="payment-method-info">
                            <span className="method-name">{method.name}</span>
                            <span
                              className={`method-status ${method.isActive ? "active" : "inactive"}`}
                            >
                              {method.isActive ? (
                                <>
                                  <img
                                    src={CheckIcon}
                                    alt="Active"
                                    className="method-status-icon-svg"
                                  />{" "}
                                  Active
                                </>
                              ) : (
                                <>
                                  <img
                                    src={CrossMarkIcon}
                                    alt="Inactive"
                                    className="method-status-icon-svg"
                                  />{" "}
                                  Inactive
                                </>
                              )}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="no-data">No payment methods configured</p>
                  )}
                </div>
              </>
            ) : (
              <div className="no-data">
                <div className="no-data-icon">
                  <img
                    src={PaymentCardIcon}
                    alt="No payment"
                    className="no-data-icon-svg-large"
                  />
                </div>
                <h3>No Payment Configuration</h3>
                <p>Payment configuration is not set up yet</p>
              </div>
            )}
          </div>
        )}

        {activeTab === "audit" && (
          <div className="audit-logs">
            <div className="section-header">
              <h2> Audit Logs</h2>
            </div>

            {loading ? (
              <div className="loading">Loading audit logs...</div>
            ) : !auditLogs ||
              (!auditLogs.recentOrders && !auditLogs.recentUsers) ? (
              <p className="no-data">
                No audit logs available. Check backend console for errors.
              </p>
            ) : (
              <>
                <div className="audit-section">
                  <h3>Recent Orders</h3>
                  {auditLogs.recentOrders &&
                  auditLogs.recentOrders.length > 0 ? (
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
                          {auditLogs.recentOrders.map((order) => (
                            <tr key={order._id}>
                              <td>#{order._id.slice(-8)}</td>
                              <td>{order.user?.name || "N/A"}</td>
                              <td>₹{order.totalAmount}</td>
                              <td>
                                <span
                                  className={`badge badge-${order.orderStatus}`}
                                >
                                  {order.orderStatus}
                                </span>
                              </td>
                              <td>
                                {new Date(order.createdAt).toLocaleString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="no-data">No recent orders</p>
                  )}
                </div>

                <div className="audit-section">
                  <h3>Recent Users</h3>
                  {auditLogs.recentUsers && auditLogs.recentUsers.length > 0 ? (
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
                          {auditLogs.recentUsers.map((user) => (
                            <tr key={user._id}>
                              <td>{user.name}</td>
                              <td>{user.email}</td>
                              <td>
                                <span className={`role-badge ${user.role}`}>
                                  {user.role}
                                </span>
                              </td>
                              <td>
                                {new Date(user.createdAt).toLocaleDateString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="no-data">No recent users</p>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* ── USER ANALYTICS ─────────────────────────────────────────── */}
        {activeTab === "user-analytics" && (
          <AnalyticsTabs
            activeAnalyticsTab="users"
            stats={stats}
            userAnalytics={userAnalytics}
            productAnalytics={productAnalytics}
            paymentConfig={paymentConfig}
          />
        )}

        {/* ── PRODUCT ANALYTICS ──────────────────────────────────────── */}
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

        {activeTab === "ai-audit" && (
          <div className="ai-tab-layout">
            <AuditLog />
          </div>
        )}
      </div>

      {/* Product Modal */}
      {showProductModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowProductModal(false)}
        >
          <div
            className="modal-content large"
            onClick={(e) => e.stopPropagation()}
          >
            <h2>
              {editingProduct ? "Edit Product" : "Add New Product"}
              <button
                className="modal-close-btn"
                onClick={() => setShowProductModal(false)}
              >
                ×
              </button>
            </h2>
            <form onSubmit={handleProductSubmit} className="product-form">
              <div className="form-group">
                <label>Product Name *</label>
                <input
                  type="text"
                  value={productForm.name}
                  onChange={(e) =>
                    setProductForm({ ...productForm, name: e.target.value })
                  }
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Category *</label>
                  <select
                    value={productForm.category}
                    onChange={(e) =>
                      setProductForm({
                        ...productForm,
                        category: e.target.value,
                      })
                    }
                    required
                  >
                    <option value="milk">Milk</option>
                    <option value="butter">Butter</option>
                    <option value="cheese">Cheese</option>
                    <option value="yogurt">Yogurt</option>
                    <option value="paneer">Paneer</option>
                    <option value="lassi">Lassi</option>
                    <option value="milkshake">Milkshake</option>
                    <option value="curd">Curd</option>
                    <option value="cream">Cream</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Variety *</label>
                  <input
                    type="text"
                    value={productForm.variety}
                    onChange={(e) =>
                      setProductForm({
                        ...productForm,
                        variety: e.target.value,
                      })
                    }
                    placeholder="e.g., Whole Milk, Cheddar, etc."
                    required
                  />
                </div>
              </div>

              <div className="form-group full-width">
                <label>Description *</label>
                <textarea
                  value={productForm.description}
                  onChange={(e) =>
                    setProductForm({
                      ...productForm,
                      description: e.target.value,
                    })
                  }
                  rows="4"
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Price (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={productForm.price}
                    onChange={(e) =>
                      setProductForm({ ...productForm, price: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Stock *</label>
                  <input
                    type="number"
                    value={productForm.stock}
                    onChange={(e) =>
                      setProductForm({ ...productForm, stock: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Image URLs (one per line)</label>
                <textarea
                  value={productForm.images.join("\n")}
                  onChange={(e) =>
                    setProductForm({
                      ...productForm,
                      images: e.target.value
                        .split("\n")
                        .filter((url) => url.trim()),
                    })
                  }
                  placeholder="Enter image URLs, one per line"
                  rows="3"
                />
              </div>

              <div className="form-group">
                <label>Video URL (optional)</label>
                <input
                  type="url"
                  value={productForm.videoUrl}
                  onChange={(e) =>
                    setProductForm({ ...productForm, videoUrl: e.target.value })
                  }
                  placeholder="https://example.com/video.mp4"
                />
              </div>

              <h3>Nutritional Information (per 100ml/g)</h3>
              <div className="form-row">
                <div className="form-group">
                  <label>Calories (kcal)</label>
                  <input
                    type="number"
                    value={productForm.nutritionalInfo.calories}
                    onChange={(e) =>
                      setProductForm({
                        ...productForm,
                        nutritionalInfo: {
                          ...productForm.nutritionalInfo,
                          calories: e.target.value,
                        },
                      })
                    }
                  />
                </div>
                <div className="form-group">
                  <label>Protein (g)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={productForm.nutritionalInfo.protein}
                    onChange={(e) =>
                      setProductForm({
                        ...productForm,
                        nutritionalInfo: {
                          ...productForm.nutritionalInfo,
                          protein: e.target.value,
                        },
                      })
                    }
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Fat (g)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={productForm.nutritionalInfo.fat}
                    onChange={(e) =>
                      setProductForm({
                        ...productForm,
                        nutritionalInfo: {
                          ...productForm.nutritionalInfo,
                          fat: e.target.value,
                        },
                      })
                    }
                  />
                </div>
                <div className="form-group">
                  <label>Calcium (mg)</label>
                  <input
                    type="number"
                    value={productForm.nutritionalInfo.calcium}
                    onChange={(e) =>
                      setProductForm({
                        ...productForm,
                        nutritionalInfo: {
                          ...productForm.nutritionalInfo,
                          calcium: e.target.value,
                        },
                      })
                    }
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowProductModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingProduct ? "Update Product" : "Create Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Blog Modal */}
      {showBlogModal && (
        <div className="modal-overlay" onClick={() => setShowBlogModal(false)}>
          <div
            className="modal-content large"
            onClick={(e) => e.stopPropagation()}
          >
            <h2>
              {editingBlog ? "Edit Blog" : "Create New Blog"}
              <button
                className="modal-close-btn"
                onClick={() => setShowBlogModal(false)}
              >
                ×
              </button>
            </h2>
            <form onSubmit={handleBlogSubmit} className="blog-form">
              <div className="form-group">
                <label>Title *</label>
                <input
                  type="text"
                  value={blogForm.title}
                  onChange={(e) =>
                    setBlogForm({ ...blogForm, title: e.target.value })
                  }
                  required
                />
              </div>

              <div className="form-group">
                <label>Excerpt *</label>
                <textarea
                  value={blogForm.excerpt}
                  onChange={(e) =>
                    setBlogForm({ ...blogForm, excerpt: e.target.value })
                  }
                  rows="2"
                  required
                />
              </div>

              <div className="form-group">
                <label>Content *</label>
                <textarea
                  value={blogForm.content}
                  onChange={(e) =>
                    setBlogForm({ ...blogForm, content: e.target.value })
                  }
                  rows="10"
                  required
                />
              </div>

              <div className="form-group">
                <label>Featured Image URL *</label>
                <input
                  type="url"
                  value={blogForm.image}
                  onChange={(e) =>
                    setBlogForm({ ...blogForm, image: e.target.value })
                  }
                  required
                />
              </div>

              <div className="form-group">
                <label>Tags (comma separated)</label>
                <input
                  type="text"
                  value={blogForm.tags.join(", ")}
                  onChange={(e) =>
                    setBlogForm({
                      ...blogForm,
                      tags: e.target.value
                        .split(",")
                        .map((t) => t.trim())
                        .filter((t) => t),
                    })
                  }
                  placeholder="dairy, health, recipes, etc."
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowBlogModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingBlog ? "Update Blog" : "Create Blog"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};

export default AdminDashboard;
