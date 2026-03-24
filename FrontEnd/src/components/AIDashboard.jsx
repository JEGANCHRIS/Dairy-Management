import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AIDashboard = () => {
  const [summary, setSummary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchSummary();
  }, []);

  const fetchSummary = async () => {
    try {
      const { data } = await axios.get('/api/admin-ai/summary');
      setSummary(data.data);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="ai-dashboard">
      <h2>AI Sales Summary</h2>
      <div className="summary-list">
        {summary.map((item) => (
          <div key={item.productId} className="summary-item">
            <span>Product: {item.productName}</span>
            <span>Total Sold: {item.totalQuantity}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AIDashboard;
