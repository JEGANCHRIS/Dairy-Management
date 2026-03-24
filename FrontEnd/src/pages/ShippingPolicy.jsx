import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/policy.css';

const ShippingPolicy = () => {
  return (
    <div className="policy-page">
      <div className="container">
        <div className="policy-content">
          <h1>Shipping Policy</h1>
          <p className="last-updated">Last Updated: March 2026</p>

          <section className="policy-section">
            <h2>1. Shipping Options</h2>
            <p>We offer the following shipping options:</p>
            <ul>
              <li><strong>Standard Delivery:</strong> 2-3 business days - Free on orders above ₹500</li>
              <li><strong>Express Delivery:</strong> Next day delivery - ₹50 flat rate</li>
            </ul>
          </section>

          <section className="policy-section">
            <h2>2. Processing Time</h2>
            <p>
              Orders are typically processed within 2-4 hours of placement. Orders placed after 8 PM will be 
              processed the next business day.
            </p>
          </section>

          <section className="policy-section">
            <h2>3. Delivery Areas</h2>
            <p>
              We currently deliver to the following areas:
            </p>
            <ul>
              <li>City center and surrounding areas</li>
              <li>Suburban regions (additional charges may apply)</li>
              <li>Select rural areas (contact us for availability)</li>
            </ul>
          </section>

          <section className="policy-section">
            <h2>4. Shipping Rates</h2>
            <p>Shipping rates are calculated based on:</p>
            <ul>
              <li>Delivery location and distance</li>
              <li>Order value (free shipping on orders above ₹500)</li>
              <li>Selected delivery speed</li>
              <li>Product type and quantity</li>
            </ul>
          </section>

          <section className="policy-section">
            <h2>5. Order Tracking</h2>
            <p>
              Once your order is dispatched, you will receive:
            </p>
            <ul>
              <li>Email confirmation with tracking information</li>
              <li>SMS notification with delivery updates</li>
              <li>Real-time tracking through our website</li>
            </ul>
          </section>

          <section className="policy-section">
            <h2>6. Delivery Instructions</h2>
            <p>
              You can provide special delivery instructions during checkout, such as:
            </p>
            <ul>
              <li>Leave at doorstep</li>
              <li>Hand delivery only</li>
              <li>Specific delivery time windows</li>
              <li>Contactless delivery preference</li>
            </ul>
          </section>

          <section className="policy-section">
            <h2>7. Failed Deliveries</h2>
            <p>
              If a delivery attempt fails:
            </p>
            <ul>
              <li>We will make up to 2 additional delivery attempts</li>
              <li>You will be notified of each attempt</li>
              <li>After 3 failed attempts, the order will be returned and refunded</li>
            </ul>
          </section>

          <section className="policy-section">
            <h2>8. Damaged Products</h2>
            <p>
              If you receive damaged products:
            </p>
            <ul>
              <li>Do not accept the delivery</li>
              <li>Contact us immediately at support@dairyfresh.com</li>
              <li>Provide photos of the damaged products</li>
              <li>We will arrange immediate replacement or refund</li>
            </ul>
          </section>

          <section className="policy-section">
            <h2>9. Cold Chain Assurance</h2>
            <p>
              All perishable dairy products are shipped in temperature-controlled packaging to ensure 
              freshness and quality upon delivery.
            </p>
          </section>

          <section className="policy-section">
            <h2>10. Contact Us</h2>
            <p>For shipping inquiries, contact us at:</p>
            <ul>
              <li>Email: shipping@dairyfresh.com</li>
              <li>Phone: +91 7339433206</li>
              <li>Hours: Mon-Sat, 9 AM - 8 PM</li>
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

export default ShippingPolicy;
