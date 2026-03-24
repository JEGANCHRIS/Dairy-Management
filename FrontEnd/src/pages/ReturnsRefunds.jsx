import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/policy.css';

const ReturnsRefunds = () => {
  return (
    <div className="policy-page">
      <div className="container">
        <div className="policy-content">
          <h1>Returns & Refunds Policy</h1>
          <p className="last-updated">Last Updated: March 2026</p>

          <section className="policy-section">
            <h2>1. Return Eligibility</h2>
            <p>
              We accept returns under the following conditions:
            </p>
            <ul>
              <li>Product is damaged or defective upon delivery</li>
              <li>Wrong product was delivered</li>
              <li>Product is expired or near expiry</li>
              <li>Product quality does not meet our standards</li>
            </ul>
          </section>

          <section className="policy-section">
            <h2>2. Non-Returnable Items</h2>
            <p>The following items cannot be returned:</p>
            <ul>
              <li>Opened or consumed products (unless defective)</li>
              <li>Products past their expiry date</li>
              <li>Products not stored according to guidelines</li>
              <li>Gift cards and promotional items</li>
            </ul>
          </section>

          <section className="policy-section">
            <h2>3. Return Process</h2>
            <p>To initiate a return:</p>
            <ol>
              <li>Contact us within 24 hours of delivery</li>
              <li>Provide order number and reason for return</li>
              <li>Share photos of the product (if applicable)</li>
              <li>Our team will verify and approve the return</li>
              <li>Schedule a pickup at your convenience</li>
            </ol>
          </section>

          <section className="policy-section">
            <h2>4. Refund Options</h2>
            <p>We offer the following refund options:</p>
            <ul>
              <li><strong>Original Payment Method:</strong> Refund to source account (3-5 business days)</li>
              <li><strong>Store Credit:</strong> Instant credit to your Dairy Fresh account</li>
              <li><strong>Replacement:</strong> Free replacement with next delivery</li>
            </ul>
          </section>

          <section className="policy-section">
            <h2>5. Refund Timeline</h2>
            <p>
              Refund processing times:
            </p>
            <ul>
              <li>Store Credit: Instant upon approval</li>
              <li>Credit/Debit Card: 3-5 business days</li>
              <li>UPI/Wallets: 1-2 business days</li>
              <li>Net Banking: 2-4 business days</li>
            </ul>
          </section>

          <section className="policy-section">
            <h2>6. Quality Issues</h2>
            <p>
              For quality-related concerns:
            </p>
            <ul>
              <li>Report within 24 hours of delivery</li>
              <li>Provide detailed description of the issue</li>
              <li>Include photos if possible</li>
              <li>We will investigate and resolve within 48 hours</li>
            </ul>
          </section>

          <section className="policy-section">
            <h2>7. Damaged Products</h2>
            <p>
              For damaged products:
            </p>
            <ul>
              <li>Do not accept the delivery if damage is visible</li>
              <li>If discovered after acceptance, contact us immediately</li>
              <li>Keep the product packaging for inspection</li>
              <li>We will arrange immediate replacement or full refund</li>
            </ul>
          </section>

          <section className="policy-section">
            <h2>8. Wrong Deliveries</h2>
            <p>
              If you receive the wrong product:
            </p>
            <ul>
              <li>Contact us within 24 hours</li>
              <li>Keep the product sealed</li>
              <li>We will arrange pickup and redelivery</li>
              <li>Replacement will be expedited at no extra cost</li>
            </ul>
          </section>

          <section className="policy-section">
            <h2>9. Cancellation Policy</h2>
            <p>
              Order cancellation:
            </p>
            <ul>
              <li>Free cancellation before order is dispatched</li>
              <li>50% refund if cancelled after dispatch</li>
              <li>No refund for cancelled express deliveries after processing</li>
            </ul>
          </section>

          <section className="policy-section">
            <h2>10. Contact Us</h2>
            <p>For returns and refunds, contact us at:</p>
            <ul>
              <li>Email: returns@dairyfresh.com</li>
              <li>Phone: +91 7339433206</li>
              <li>Hours: Mon-Sat, 9 AM - 8 PM</li>
              <li>Live Chat: Available on website</li>
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

export default ReturnsRefunds;
