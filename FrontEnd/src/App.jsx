import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import { WishlistProvider } from "./context/WishlistContext";
import { ThemeProvider } from "./context/ThemeContext";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import Blogs from "./pages/Blogs";
import BlogDetail from "./pages/BlogDetail";
import UserDashboard from "./pages/Dashboard/UserDashboard";
import ManagerDashboard from "./pages/Dashboard/ManagerDashboard";
import AdminDashboard from "./pages/Dashboard/AdminDashboard";
import SuperAdminDashboard from "./pages/Dashboard/SuperAdminDashboard";
import UserManagement from "./pages/UserManagement";
import AdminProducts from "./pages/AdminProducts";
import Profile from "./pages/Profile";
import Orders from "./pages/Orders";
import OrderConfirmation from "./pages/OrderConfirmation";
import Payment from "./pages/Payment";
import BankManagement from "./pages/BankManagement";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import ShippingPolicy from "./pages/ShippingPolicy";
import ReturnsRefunds from "./pages/ReturnsRefunds";
import Wishlist from "./pages/Wishlist";
import PrivateRoute from "./components/PrivateRoute";
import ChatBot from "./components/ChatBot/ChatBot";
import "./styles/main.css";
import "./styles/orders.css";
import "./styles/navbar.css";
import "./styles/footer.css";
import "./styles/auth.css";
import "./styles/products.css";
import "./styles/cart.css";
import "./styles/checkout.css";
import "./styles/blogs.css";
import "./styles/toast.css";
import "./styles/dashboard.css";
import "./styles/responsive.css";
import "./styles/user-management.css";
import "./styles/adminProducts.css";
import "./styles/order-confirmation.css";
import "./styles/payment.css";
import "./styles/bank-management.css";
import "./styles/policy.css";
import "./styles/profile.css";

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <CartProvider>
          <WishlistProvider>
            <Router>
              <div className="App">
                <Navbar />
                <main>
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/products" element={<Products />} />
                    <Route path="/product/:id" element={<ProductDetail />} />
                    <Route path="/blogs" element={<Blogs />} />
                    <Route path="/blog/:id" element={<BlogDetail />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route
                      path="/forgot-password"
                      element={<ForgotPassword />}
                    />

                    {/* Protected Routes */}
                    <Route
                      path="/cart"
                      element={
                        <PrivateRoute>
                          <Cart />
                        </PrivateRoute>
                      }
                    />

                    <Route
                      path="/checkout"
                      element={
                        <PrivateRoute>
                          <Checkout />
                        </PrivateRoute>
                      }
                    />

                    <Route
                      path="/dashboard/user"
                      element={
                        <PrivateRoute>
                          <UserDashboard />
                        </PrivateRoute>
                      }
                    />

                    <Route
                      path="/dashboard/manager"
                      element={
                        <PrivateRoute
                          requiredRole={["manager", "admin", "superAdmin"]}
                        >
                          <ManagerDashboard />
                        </PrivateRoute>
                      }
                    />

                    <Route
                      path="/dashboard/admin"
                      element={
                        <PrivateRoute requiredRole={["admin", "superAdmin"]}>
                          <AdminDashboard />
                        </PrivateRoute>
                      }
                    />

                    <Route
                      path="/dashboard/super-admin"
                      element={
                        <PrivateRoute requiredRole={["superAdmin"]}>
                          <SuperAdminDashboard />
                        </PrivateRoute>
                      }
                    />

                    <Route
                      path="/user-management"
                      element={
                        <PrivateRoute requiredRole={["superAdmin"]}>
                          <UserManagement />
                        </PrivateRoute>
                      }
                    />

                    <Route
                      path="/admin/products"
                      element={
                        <PrivateRoute requiredRole={["admin", "superAdmin"]}>
                          <AdminProducts />
                        </PrivateRoute>
                      }
                    />

                    <Route
                      path="/profile"
                      element={
                        <PrivateRoute>
                          <Profile />
                        </PrivateRoute>
                      }
                    />

                    <Route
                      path="/orders"
                      element={
                        <PrivateRoute>
                          <Orders />
                        </PrivateRoute>
                      }
                    />

                    <Route
                      path="/order-confirmation/:orderId"
                      element={
                        <PrivateRoute>
                          <OrderConfirmation />
                        </PrivateRoute>
                      }
                    />

                    <Route
                      path="/payment/:orderId"
                      element={
                        <PrivateRoute>
                          <Payment />
                        </PrivateRoute>
                      }
                    />

                    <Route
                      path="/admin/bank-accounts"
                      element={
                        <PrivateRoute roles={["superAdmin"]}>
                          <BankManagement />
                        </PrivateRoute>
                      }
                    />

                    {/* Policy Pages - Public Routes */}
                    <Route path="/privacy" element={<PrivacyPolicy />} />
                    <Route path="/terms" element={<TermsOfService />} />
                    <Route path="/shipping" element={<ShippingPolicy />} />
                    <Route path="/returns" element={<ReturnsRefunds />} />

                    <Route
                      path="/wishlist"
                      element={
                        <PrivateRoute>
                          <Wishlist />
                        </PrivateRoute>
                      }
                    />
                  </Routes>
                </main>
                <Footer />
                <ChatBot />
              </div>
            </Router>
            <ToastContainer />
          </WishlistProvider>
        </CartProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
