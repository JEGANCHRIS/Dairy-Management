import React, { useState, useEffect } from "react";
import ProductSlider from "../components/ProductSlider";
import ProductCard from "../components/ProductCard";
import { Link, useLocation } from "react-router-dom";
import api from "../utils/api";
import "../styles/main.css";
import DeliveryTruckIcon from "../assets/delivery-truck.svg";
import CheckIcon from "../assets/check.svg";
import FreshnessIcon from "../assets/freshness.svg";
import CartIcon from "../assets/shopping-cart.svg";
import LocationIcon from "../assets/location.svg";
import ContactIcon from "../assets/contact-number.svg";
import MailIcon from "../assets/mail.svg";
import ClockIcon from "../assets/clock.svg";

const Home = () => {
  const [products, setProducts] = useState([]);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });
  const [formStatus, setFormStatus] = useState({ type: "", message: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const location = useLocation();

  useEffect(() => {
    fetchProducts();

    // Scroll to section if navigated with scroll state
    if (location.state?.scrollTo) {
      const element = document.getElementById(location.state.scrollTo);
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 100);
      }
    }
  }, [location]);

  const fetchProducts = async () => {
    try {
      const response = await api.get("/products");
      const productsData = Array.isArray(response.data)
        ? response.data
        : response.data.products || [];
      setProducts(productsData.slice(0, 8));
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormStatus({ type: "", message: "" });

    console.log("📤 Submitting contact form...");
    console.log("Form data:", formData);
    console.log("API base URL:", api.defaults.baseURL);

    try {
      const response = await api.post("/contact", formData);
      console.log("✅ Contact form response:", response.data);
      setFormStatus({
        type: "success",
        message:
          response.data?.message ||
          "Thank you! Your message has been sent successfully.",
      });
      setFormData({
        name: "",
        email: "",
        phone: "",
        subject: "",
        message: "",
      });
    } catch (error) {
      console.error("❌ Error submitting form:", error);
      console.error("Error response:", error.response?.data);
      console.error("Error status:", error.response?.status);
      console.error("Error headers:", error.response?.headers);
      console.error("Error config:", error.config);

      let errorMessage = "Failed to send message. Please try again.";

      if (error.response) {
        errorMessage =
          error.response?.data?.message ||
          error.response?.data?.error ||
          "Server error";
      } else if (error.request) {
        errorMessage =
          "No response from server. Please check if the backend is running.";
      } else {
        errorMessage = error.message || "Network error";
      }

      setFormStatus({
        type: "error",
        message: errorMessage,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <section className="hero-section">
        <div className="hero-background-image"></div>
        <div className="hero-overlay"></div>
        <div className="container">
          <div className="hero-content">
            <h1>Welcome to Dairy Fresh</h1>
            <p className="banner-msg">
              Farm-Fresh Milk, Cheese & More – Quality You Can Trust, Taste
              You'll Love
            </p>
            <p className="hero-description">
              Rich in calcium, protein & vitamins – our fresh dairy products
              nourish your bones, boost immunity, and keep your heart healthy.
              Pure goodness for the whole family!
            </p>
            <a href="#products" className="btn btn-primary">
              Shop Now
            </a>
          </div>
        </div>
      </section>

      <ProductSlider />

      {/* Products Section */}
      <section className="products-section" id="products">
        <div className="container">
          <h2>Our Products</h2>
          <p className="section-subtitle">
            Fresh dairy products delivered at your doorstep
          </p>

          <div className="products-grid">
            {products.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>

          <div className="view-all-container">
            <Link to="/products" className="btn btn-view-all">
              View All Products
              <img src={CartIcon} alt="Cart" className="view-all-cart-svg" />
            </Link>
          </div>
        </div>
      </section>

      <section className="features-section" id="features">
        <div className="container">
          <h2>Why Choose Us</h2>
          <p className="section-subtitle">
            Experience the Dairy Fresh difference – quality you can trust
          </p>
          <div className="row">
            <div className="col">
              <div className="feature-card">
                <div className="feature-icon">
                  <img
                    src={FreshnessIcon}
                    alt="Freshness"
                    className="feature-icon-svg"
                  />
                </div>
                <h3>100% Fresh & Pure</h3>
                <p>
                  All our products are sourced directly from local farms daily,
                  ensuring maximum freshness and purity in every bite
                </p>
              </div>
            </div>
            <div className="col">
              <div className="feature-card">
                <div className="feature-icon">
                  <img
                    src={DeliveryTruckIcon}
                    alt="Delivery"
                    className="feature-icon-svg"
                  />
                </div>
                <h3>Lightning Fast Delivery</h3>
                <p>
                  Free doorstep delivery on orders above ₹500 – order today,
                  receive tomorrow, fresh as always
                </p>
              </div>
            </div>
            <div className="col">
              <div className="feature-card">
                <div className="feature-icon">
                  <img
                    src={CheckIcon}
                    alt="Quality"
                    className="feature-icon-svg"
                  />
                </div>
                <h3>Quality Guaranteed</h3>
                <p>
                  Rigorous quality checks at every step – we ensure only the
                  highest standards reach your table
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="about-section" id="about">
        <div className="container">
          <h2>About Us</h2>
          <p className="section-subtitle">
            Your trusted partner for fresh dairy products since day one
          </p>

          <div className="about-content">
            <div className="about-text">
              <p>
                At Dairy Fresh, we are passionate about delivering the freshest,
                highest-quality dairy products directly from local farms to your
                doorstep. Our commitment to excellence and customer satisfaction
                has made us a trusted name in the dairy industry.
              </p>
              <p>
                We work closely with local farmers to ensure that every product
                meets our strict quality standards. From milk and cheese to
                butter and yogurt, our range of products is crafted with care
                and delivered with love.
              </p>
              <div className="about-stats">
                <div className="stat-item">
                  <span className="stat-number">1000+</span>
                  <span className="stat-label">Happy Customers</span>
                </div>
                <div className="stat-item">
                  <span className="stat-number">50+</span>
                  <span className="stat-label">Products</span>
                </div>
                <div className="stat-item">
                  <span className="stat-number">100%</span>
                  <span className="stat-label">Fresh & Pure</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="contact-section" id="contact">
        <div className="container">
          <h2>Contact Us</h2>
          <p className="section-subtitle">
            Have a question? We'd love to hear from you!
          </p>

          <div className="contact-form-container">
            <form className="contact-form" onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="name">Your Name *</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    placeholder="John Doe"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="email">Email Address *</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    placeholder="john@example.com"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="phone">Phone Number</label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="+91 7339433206"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="subject">Subject *</label>
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleInputChange}
                    required
                    placeholder="How can we help?"
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="message">Your Message *</label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  required
                  rows="5"
                  placeholder="Write your message here..."
                ></textarea>
              </div>

              {formStatus.message && (
                <div className={`form-message ${formStatus.type}`}>
                  {formStatus.message}
                </div>
              )}

              <button
                type="submit"
                className="btn btn-submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Sending..." : "Send Message"}
              </button>
            </form>
          </div>

          <div className="contact-info-cards">
            <div className="contact-info-card">
              <span className="icon">
                <img
                  src={LocationIcon}
                  alt="Location"
                  className="contact-icon-svg"
                />
              </span>
              <h4>Visit Us</h4>
              <p>123 Dairy Street, Food City</p>
            </div>
            <div className="contact-info-card">
              <span className="icon">
                <img
                  src={ContactIcon}
                  alt="Contact"
                  className="contact-icon-svg"
                />
              </span>
              <h4>Call Us</h4>
              <p>+91 7339433206</p>
            </div>
            <div className="contact-info-card">
              <span className="icon">
                <img src={MailIcon} alt="Mail" className="contact-icon-svg" />
              </span>
              <h4>Email Us</h4>
              <p>jmchristo.2000@gmail.com</p>
            </div>
            <div className="contact-info-card">
              <span className="icon">
                <img src={ClockIcon} alt="Clock" className="contact-icon-svg" />
              </span>
              <h4>Working Hours</h4>
              <p>Mon-Sat: 9AM - 8PM</p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default Home;
