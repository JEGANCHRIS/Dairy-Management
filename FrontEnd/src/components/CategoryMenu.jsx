import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import '../styles/products.css';

const CategoryMenu = ({ onCategorySelect }) => {
  const [categories, setCategories] = useState({});
  const [activeCategory, setActiveCategory] = useState(null);
  const [activeVariety, setActiveVariety] = useState(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await api.get('/products/categories');
      setCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleCategoryClick = (category) => {
    setActiveCategory(category);
    setActiveVariety(null);
    onCategorySelect({ category, variety: null });
  };

  const handleVarietyClick = (category, variety) => {
    setActiveCategory(category);
    setActiveVariety(variety);
    onCategorySelect({ category, variety });
  };

  return (
    <div className="categories-section">
      <h3>Categories</h3>

      <div className="categories-grid">
        {Object.entries(categories).map(([category, varieties]) => (
          <div key={category} className="category-group">
            <h4
              className={activeCategory === category ? 'active' : ''}
              onClick={() => handleCategoryClick(category)}
            >
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </h4>

            <div className="varieties-list">
              {varieties.map((variety) => (
                <button
                  key={variety}
                  className={`variety-btn ${
                    activeCategory === category && activeVariety === variety ? 'active' : ''
                  }`}
                  onClick={() => handleVarietyClick(category, variety)}
                >
                  {variety}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CategoryMenu;