import React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import facebookIcon from "../assets/facebook.svg";
import instagramIcon from "../assets/instagram.svg";
import twitterIcon from "../assets/twitter.svg";
import whatsappIcon from "../assets/whatsapp.svg";
import LocationIcon from "../assets/location.svg";
import ContactIcon from "../assets/contact-number.svg";
import MailIcon from "../assets/mail.svg";
import ClockIcon from "../assets/clock.svg";
import "../styles/footer.css";

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const navigate = useNavigate();
  const location = useLocation();

  const scrollToSection = (sectionId) => {
    // If not on homepage, navigate to home first
    if (location.pathname !== "/") {
      navigate("/", { state: { scrollTo: sectionId } });
    } else {
      // If already on homepage, scroll to section
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  };

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          <div className="footer-section">
            <h3 className="logo-text">
              Dairy<span className="logo-highlight"> Fresh</span>
            </h3>
            <p>
              Fresh dairy products delivered to your doorstep. Quality you can
              trust, taste you'll love.
            </p>
            <div className="social-links">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
              >
                <img src={facebookIcon} alt="Facebook" />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
              >
                <img src={instagramIcon} alt="Instagram" />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Twitter"
              >
                <img src={twitterIcon} alt="Twitter" />
              </a>
              <a
                href="https://whatsapp.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="WhatsApp"
              >
                <img src={whatsappIcon} alt="WhatsApp" />
              </a>
            </div>
          </div>

          <div className="footer-section">
            <h4>Quick Links</h4>
            <ul>
              <li>
                <Link to="/">Home</Link>
              </li>
              <li>
                <Link to="/products">Products</Link>
              </li>
              <li>
                <Link to="/blogs">Blogs</Link>
              </li>
              <li>
                <button
                  onClick={() => scrollToSection("about")}
                  className="footer-link-btn"
                >
                  About Us
                </button>
              </li>
              <li>
                <button
                  onClick={() => scrollToSection("contact")}
                  className="footer-link-btn"
                >
                  Contact
                </button>
              </li>
            </ul>
          </div>

          <div className="footer-section">
            <h4>Categories</h4>
            <ul>
              <li>
                <Link to="/products?category=milk">Milk</Link>
              </li>
              <li>
                <Link to="/products?category=cheese">Cheese</Link>
              </li>
              <li>
                <Link to="/products?category=butter">Butter</Link>
              </li>
              <li>
                <Link to="/products?category=yogurt">Yogurt</Link>
              </li>
              <li>
                <Link to="/products?category=paneer">Paneer</Link>
              </li>
            </ul>
          </div>

          <div className="footer-section">
            <h4>Contact Info</h4>
            <ul className="contact-info">
              <li>
                <span className="contact-icon">
                  <img
                    src={LocationIcon}
                    alt="Location"
                    className="footer-contact-svg"
                  />
                </span>
                <span>123 Dairy Street, Food City, FC 12345</span>
              </li>
              <li>
                <span className="contact-icon">
                  <img
                    src={ContactIcon}
                    alt="Contact"
                    className="footer-contact-svg"
                  />
                </span>
                <span>+91 7339433206</span>
              </li>
              <li>
                <span className="contact-icon">
                  <img
                    src={MailIcon}
                    alt="Mail"
                    className="footer-contact-svg"
                  />
                </span>
                <span>jmchristo.2000@gmail.com</span>
              </li>
              <li>
                <span className="contact-icon">
                  <img
                    src={ClockIcon}
                    alt="Clock"
                    className="footer-contact-svg"
                  />
                </span>
                <span>Mon-Sat: 9:00 AM - 8:00 PM</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <p>&copy; {currentYear} Dairy Fresh. All rights reserved.</p>
          <div className="footer-bottom-links">
            <Link to="/privacy">Privacy Policy</Link>
            <Link to="/terms">Terms of Service</Link>
            <Link to="/shipping">Shipping Policy</Link>
            <Link to="/returns">Returns & Refunds</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
