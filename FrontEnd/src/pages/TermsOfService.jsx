import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/policy.css';

const TermsOfService = () => {
  return (
    <div className="policy-page">
      <div className="container">
        <div className="policy-content">
          <h1>Terms of Service</h1>
          <p className="last-updated">Last Updated: March 2026</p>

          <section className="policy-section">
            <h2>1. Acceptance of Terms</h2>
            <p>
              By accessing and using Dairy Fresh's services, you accept and agree to be bound by these Terms of Service. 
              If you do not agree to these terms, please do not use our services.
            </p>
          </section>

          <section className="policy-section">
            <h2>2. Use of Services</h2>
            <p>You agree to:</p>
            <ul>
              <li>Provide accurate and complete information</li>
              <li>Maintain the security of your account</li>
              <li>Use the service only for lawful purposes</li>
              <li>Not interfere with the proper working of the service</li>
              <li>Not attempt to gain unauthorized access to our systems</li>
            </ul>
          </section>

          <section className="policy-section">
            <h2>3. Orders and Payments</h2>
            <p>
              By placing an order, you agree to:
            </p>
            <ul>
              <li>Pay the specified price for products ordered</li>
              <li>Provide accurate delivery information</li>
              <li>Be available to receive deliveries at the specified time</li>
              <li>Inspect products upon delivery and report issues promptly</li>
            </ul>
          </section>

          <section className="policy-section">
            <h2>4. Product Information</h2>
            <p>
              We strive to provide accurate product descriptions, images, and pricing. However, we do not guarantee 
              that all information is error-free. Products are subject to availability and prices may change without notice.
            </p>
          </section>

          <section className="policy-section">
            <h2>5. Delivery</h2>
            <p>
              We offer standard and express delivery options. Delivery times are estimates and not guaranteed. 
              We are not liable for delays caused by factors beyond our control.
            </p>
          </section>

          <section className="policy-section">
            <h2>6. Limitation of Liability</h2>
            <p>
              Dairy Fresh shall not be liable for any indirect, incidental, special, or consequential damages arising 
              from your use of our services, including but not limited to loss of profits, data, or business opportunities.
            </p>
          </section>

          <section className="policy-section">
            <h2>7. Modifications to Service</h2>
            <p>
              We reserve the right to modify or discontinue any part of our service at any time without prior notice. 
              We shall not be liable for any modifications or suspensions of the service.
            </p>
          </section>

          <section className="policy-section">
            <h2>8. Termination</h2>
            <p>
              We may terminate or suspend your account and access to our services immediately, without prior notice, 
              for conduct that we believe violates these terms or is harmful to other users, us, or third parties.
            </p>
          </section>

          <section className="policy-section">
            <h2>9. Governing Law</h2>
            <p>
              These terms shall be governed by and construed in accordance with the laws of India, without regard 
              to its conflict of law provisions.
            </p>
          </section>

          <section className="policy-section">
            <h2>10. Contact Information</h2>
            <p>For questions about these Terms of Service, contact us at:</p>
            <ul>
              <li>Email: legal@dairyfresh.com</li>
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

export default TermsOfService;
