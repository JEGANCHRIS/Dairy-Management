import React, { useContext, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { CartContext } from "../context/CartContext";
import { WishlistContext } from "../context/WishlistContext";
import { useTheme } from "../context/ThemeContext";
import "../styles/navbar.css";
import SunIcon from "../assets/light-mode.svg";
import MoonIcon from "../assets/dark-mode.svg";
import CartIcon from "../assets/shopping-cart.svg";
import UserIcon from "../assets/user-logo.svg";
import HeartColorfullIcon from "../assets/heart-colorfull.svg";

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const { cartItems } = useContext(CartContext);
  const { wishlistCount } = useContext(WishlistContext);
  const { isDarkMode, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const scrollToHome = (e) => {
    e.preventDefault();
    if (location.pathname !== "/") {
      navigate("/");
      setTimeout(() => {
        const heroSection = document.querySelector(".hero-section");
        if (heroSection) {
          heroSection.scrollIntoView({ behavior: "smooth" });
        }
      }, 100);
    } else {
      const heroSection = document.querySelector(".hero-section");
      if (heroSection) {
        heroSection.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
    setMobileMenuOpen(false);
  };

  const scrollToProducts = (e) => {
    e.preventDefault();
    if (location.pathname !== "/") {
      navigate("/");
      setTimeout(() => {
        const productsSection = document.getElementById("products");
        if (productsSection) {
          productsSection.scrollIntoView({ behavior: "smooth" });
        }
      }, 100);
    } else {
      const productsSection = document.getElementById("products");
      if (productsSection) {
        productsSection.scrollIntoView({ behavior: "smooth" });
      }
    }
    setMobileMenuOpen(false);
  };

  const scrollToContact = (e) => {
    e.preventDefault();
    if (location.pathname !== "/") {
      navigate("/");
      setTimeout(() => {
        const contactSection = document.getElementById("contact");
        if (contactSection) {
          contactSection.scrollIntoView({ behavior: "smooth" });
        }
      }, 100);
    } else {
      const contactSection = document.getElementById("contact");
      if (contactSection) {
        contactSection.scrollIntoView({ behavior: "smooth" });
      }
    }
    setMobileMenuOpen(false);
  };

  const scrollToAbout = (e) => {
    e.preventDefault();
    if (location.pathname !== "/") {
      navigate("/");
      setTimeout(() => {
        const footerSection = document.querySelector(".footer");
        if (footerSection) {
          footerSection.scrollIntoView({ behavior: "smooth" });
        }
      }, 100);
    } else {
      const footerSection = document.querySelector(".footer");
      if (footerSection) {
        footerSection.scrollIntoView({ behavior: "smooth" });
      }
    }
    setMobileMenuOpen(false);
  };

  const getDashboardLink = () => {
    switch (user?.role) {
      case "superAdmin":
        return "/dashboard/super-admin";
      case "admin":
        return "/dashboard/admin";
      case "manager":
        return "/dashboard/manager";
      default:
        return "/dashboard/user";
    }
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* Logo Section */}
        <div className="navbar-left">
          <Link to="/" className="logo">
            <span className="logo-text">
              Dairy<span className="logo-highlight">Fresh</span>
            </span>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <ul className="nav-links">
          <li>
            <a href="#home" className="nav-link" onClick={scrollToHome}>
              Home
            </a>
          </li>
          <li>
            <a href="#products" className="nav-link" onClick={scrollToProducts}>
              Products
            </a>
          </li>
          <li>
            <Link to="/blogs" className="nav-link">
              Blogs
            </Link>
          </li>
          <li>
            <a href="#about" className="nav-link" onClick={scrollToAbout}>
              About
            </a>
          </li>
          <li>
            <a href="#contact" className="nav-link" onClick={scrollToContact}>
              Contact
            </a>
          </li>
        </ul>

        {/* Right Section */}
        <div className="nav-right">
          {/* Theme Toggle */}
          <button
            className={`theme-toggle ${isDarkMode ? "dark" : ""}`}
            onClick={toggleTheme}
            aria-label="Toggle theme"
          >
            <span className="theme-icon sun">
              <img src={SunIcon} alt="Light Mode" className="theme-icon-svg" />
            </span>
            <span className="theme-icon moon">
              <img src={MoonIcon} alt="Dark Mode" className="theme-icon-svg" />
            </span>
          </button>

          {/* Cart */}
          <Link to="/cart" className="cart-wrapper">
            <div className="cart-icon">
              <span className="cart-svg">
                <img src={CartIcon} alt="Cart" className="cart-icon-svg" />
              </span>
              {cartItems.length > 0 && (
                <span className="cart-count">{cartItems.length}</span>
              )}
            </div>
          </Link>

          {/* Wishlist */}
          <Link to="/wishlist" className="wishlist-wrapper">
            <div className="wishlist-icon">
              <span className="wishlist-svg">
                <img
                  src={HeartColorfullIcon}
                  alt="Wishlist"
                  className="wishlist-heart-svg"
                />
              </span>
              {wishlistCount > 0 && (
                <span className="wishlist-count">{wishlistCount}</span>
              )}
            </div>
          </Link>

          {/* User Menu */}
          {user ? (
            <div className="user-menu-wrapper">
              <button
                className="user-menu-btn"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
              >
                <span className="user-avatar">
                  <img src={UserIcon} alt="User" className="user-avatar-svg" />
                </span>
                <span className="user-name">{user.name}</span>
                <span
                  className={`dropdown-arrow ${userMenuOpen ? "open" : ""}`}
                >
                  ▼
                </span>
              </button>

              {userMenuOpen && (
                <div className="dropdown-menu">
                  <div className="dropdown-header">
                    <span className="dropdown-avatar">
                      <img
                        src={UserIcon}
                        alt="User"
                        className="dropdown-avatar-svg"
                      />
                    </span>
                    <div>
                      <p className="dropdown-username">{user.name}</p>
                      <p className="dropdown-role">{user.role}</p>
                    </div>
                  </div>
                  <div className="dropdown-divider"></div>
                  <Link
                    to={getDashboardLink()}
                    className="dropdown-item"
                    onClick={() => setUserMenuOpen(false)}
                  >
                    <span className="dropdown-icon">📊</span>Dashboard
                  </Link>
                  <Link
                    to="/profile"
                    className="dropdown-item"
                    onClick={() => setUserMenuOpen(false)}
                  >
                    <span className="dropdown-icon">⚙️</span>Profile
                  </Link>
                  <Link
                    to="/orders"
                    className="dropdown-item"
                    onClick={() => setUserMenuOpen(false)}
                  >
                    <span className="dropdown-icon">📦</span>My Orders
                  </Link>
                  {user.role === "admin" || user.role === "superAdmin" ? (
                    <Link
                      to="/admin/products"
                      className="dropdown-item"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <span className="dropdown-icon">🔧</span>Manage Products
                    </Link>
                  ) : null}
                  <div className="dropdown-divider"></div>
                  <button
                    onClick={handleLogout}
                    className="dropdown-item logout"
                  >
                    <span className="dropdown-icon">🚪</span>Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="auth-buttons">
              <Link to="/login" className="btn-login">
                Login
              </Link>
              <Link to="/register" className="btn-register">
                Register
              </Link>
            </div>
          )}

          {/* Mobile Menu Toggle */}
          <button
            className={`mobile-menu-btn ${mobileMenuOpen ? "active" : ""}`}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <div className={`mobile-menu ${mobileMenuOpen ? "active" : ""}`}>
        <ul className="mobile-nav-links">
          <li>
            <a href="#home" onClick={scrollToHome}>
              Home
            </a>
          </li>
          <li>
            <a href="#products" onClick={scrollToProducts}>
              Products
            </a>
          </li>
          <li>
            <Link to="/blogs" onClick={() => setMobileMenuOpen(false)}>
              Blogs
            </Link>
          </li>
          <li>
            <a href="#about" onClick={scrollToAbout}>
              About
            </a>
          </li>
          <li>
            <a href="#contact" onClick={scrollToContact}>
              Contact
            </a>
          </li>
          {!user && (
            <>
              <li>
                <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                  Login
                </Link>
              </li>
              <li>
                <Link to="/register" onClick={() => setMobileMenuOpen(false)}>
                  Register
                </Link>
              </li>
            </>
          )}
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;
