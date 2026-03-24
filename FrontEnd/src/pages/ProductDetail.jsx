import React, { useState, useEffect, useContext } from 'react';
import { useParams } from 'react-router-dom';
import { CartContext } from '../context/CartContext';
import api from '../utils/api';
import '../styles/products.css';

const ProductDetail = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState('');
  const { addToCart } = useContext(CartContext);

  // Use sizes from product data if available, otherwise fallback to defaults
  const defaultSizes = [
    { label: 'Small',  amount: 250, unit: 'ml', priceMultiplier: 0.8 },
    { label: 'Medium', amount: 500, unit: 'ml', priceMultiplier: 1   },
    { label: 'Large',  amount: 1,   unit: 'L',  priceMultiplier: 1.5 },
  ];

  const sizeOptions = (product?.sizes && product.sizes.length > 0)
    ? product.sizes
    : defaultSizes;

  // Calculate price based on selected size
  const selectedSizeData = sizeOptions.find(s => s.label === selectedSize) || sizeOptions[0];
  const currentPrice = product ? product.price * (selectedSizeData?.priceMultiplier || 1) : 0;

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    try {
      const response = await api.get(`/products/${id}`);
      const p = response.data;
      setProduct(p);
      // Set default selected size to first available size
      const firstSize = p.sizes && p.sizes.length > 0 ? p.sizes[0].label : 'Medium';
      setSelectedSize(firstSize);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching product:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <section className="product-detail">
        <div className="container">
          <div className="loading">Loading product details...</div>
        </div>
      </section>
    );
  }

  if (!product) {
    return (
      <section className="product-detail">
        <div className="container">
          <div className="error">Product not found</div>
        </div>
      </section>
    );
  }

  return (
    <section className="product-detail">
      <div className="container">
        <div className="product-detail-container">
          <div className="product-images">
            <div className="main-image-wrapper">
              <img
                src={product.images[selectedImage]
                  ? (product.images[selectedImage].startsWith('/uploads')
                    ? 'http://localhost:5000' + product.images[selectedImage]
                    : product.images[selectedImage])
                  : 'https://via.placeholder.com/500x500?text=No+Image'}
                alt={product.name}
                className="main-image"
                onError={(e) => {
                  e.target.src = 'https://via.placeholder.com/500x500?text=No+Image';
                }}
              />
            </div>

            {/* Size Selector */}
            <div className="size-selector">
              <h3 className="size-label">Select Size:</h3>
              <div className="size-options">
                {sizeOptions.map((size) => (
                  <button
                    key={size.label}
                    className={`size-btn ${selectedSize === size.label ? 'active' : ''}`}
                    onClick={() => setSelectedSize(size.label)}
                  >
                    <span className="size-name">{size.label}</span>
                    <span className="size-volume">{size.amount}{size.unit}</span>
                    <span className="size-price">₹{(product.price * size.priceMultiplier).toFixed(2)}</span>
                  </button>
                ))}
              </div>
            </div>

            {product.images.length > 1 && (
              <div className="thumbnail-images">
                {product.images.map((image, index) => (
                  <img
                    key={index}
                    src={image.startsWith('/uploads')
                      ? 'http://localhost:5000' + image
                      : image}
                    alt={`${product.name} ${index + 1}`}
                    className={`thumbnail ${selectedImage === index ? 'active' : ''}`}
                    onClick={() => setSelectedImage(index)}
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/100x100?text=No+Image';
                    }}
                  />
                ))}
              </div>
            )}

            {product.videoUrl && (
              <video controls className="product-video">
                <source src={product.videoUrl} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            )}
          </div>

          <div className="product-info">
            <h1>{product.name}</h1>
            
            <div className="product-meta">
              <span className="product-category">
                {product.category} - {product.variety}
              </span>
              <span className={`product-stock ${product.stock > 0 ? 'in-stock' : 'out-of-stock'}`}>
                {product.stock > 0 ? `In Stock: ${product.stock}` : 'Out of Stock'}
              </span>
            </div>

            <div className="product-price">
              ₹{currentPrice.toFixed(2)}
            </div>

            <div className="product-description">
              <h3>Description</h3>
              <p>{product.description}</p>
            </div>

            {product.nutritionalInfo && (
              <div className="nutrition-info">
                <h3>Nutritional Information</h3>
                <div className="nutrition-grid">
                  {Object.entries(product.nutritionalInfo).map(([key, value]) => (
                    <div key={key} className="nutrition-item">
                      <span>{key.charAt(0).toUpperCase() + key.slice(1)}</span>
                      <span>{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              className="btn btn-success btn-large"
              onClick={() => {
                const productWithSize = {
                  ...product,
                  selectedSize: selectedSizeData.label,
                  sizeVolume: `${selectedSizeData.amount}${selectedSizeData.unit}`,
                  price: currentPrice
                };
                addToCart(productWithSize);
              }}
              disabled={product.stock === 0}
            >
              {product.stock > 0 ? `Add to Cart - ₹${currentPrice.toFixed(2)}` : 'Out of Stock'}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProductDetail;