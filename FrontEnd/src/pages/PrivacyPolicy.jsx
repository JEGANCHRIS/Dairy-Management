import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/policy.css';

const PrivacyPolicy = () => {
  return (
    <div className="policy-page">
      <div className="container">
        <div className="policy-content">
          <h1>Privacy Policy</h1>
          <p className="last-updated">Last Updated: March 2026</p>

          <section className="policy-section">
            <h2>1. Introduction</h2>
            <p>
              Welcome to Dairy Fresh. We respect your privacy and are committed to protecting your personal information. 
              This Privacy Policy explains how we collect, use, and safeguard your data when you use our services.
            </p>
          </section>

          <section className="policy-section">
            <h2>2. Information We Collect</h2>
            <p>We collect the following types of information:</p>
            <ul>
              <li><strong>Personal Information:</strong> Name, email address, phone number, and delivery address</li>
              <li><strong>Payment Information:</strong> Credit card details and billing information</li>
              <li><strong>Order Information:</strong> Products purchased, order history, and preferences</li>
              <li><strong>Usage Data:</strong> How you interact with our website and services</li>
            </ul>
          </section>

          <section className="policy-section">
            <h2>3. How We Use Your Information</h2>
            <p>We use your information to:</p>
            <ul>
              <li>Process and deliver your orders</li>
              <li>Communicate with you about your orders and account</li>
              <li>Send promotional emails and updates (with your consent)</li>
              <li>Improve our products and services</li>
              <li>Prevent fraud and ensure security</li>
            </ul>
          </section>

          <section className="policy-section">
            <h2>4. Data Sharing</h2>
            <p>
              We do not sell your personal information to third parties. We may share your data with:
            </p>
            <ul>
              <li>Delivery partners to fulfill your orders</li>
              <li>Payment processors to handle transactions</li>
              <li>Service providers who help us operate our business</li>
              <li>Legal authorities when required by law</li>
            </ul>
          </section>

          <section className="policy-section">
            <h2>5. Data Security</h2>
            <p>
              We implement industry-standard security measures to protect your personal information, including 
              encryption, secure servers, and regular security audits.
            </p>
          </section>

          <section className="policy-section">
            <h2>6. Your Rights</h2>
            <p>You have the right to:</p>
            <ul>
              <li>Access your personal data</li>
              <li>Correct inaccurate data</li>
              <li>Request deletion of your data</li>
              <li>Opt-out of marketing communications</li>
              <li>Export your data</li>
            </ul>
          </section>

          <section className="policy-section">
            <h2>7. Cookies</h2>
            <p>
              We use cookies to enhance your browsing experience, analyze site traffic, and personalize content. 
              You can control cookie settings through your browser preferences.
            </p>
          </section>

          <section className="policy-section">
            <h2>8. Contact Us</h2>
            <p>
              If you have any questions about this Privacy Policy, please contact us at:
            </p>
            <ul>
              <li>Email: privacy@dairyfresh.com</li>
              <li>Phone: +91 7339433206</li>
              <li>Address: 123 Dairy Street, Food City, FC 12345</li>
            </ul>
          </section>

          <div className="policy-footer">
            <Link to="/" className="btn btn-back">← Back to Home</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
