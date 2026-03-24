import React, { useState, useEffect, useContext } from "react";
import { Link } from "react-router-dom";
import { WishlistContext } from "../context/WishlistContext";
import "../styles/products.css";
import "../styles/wishlist.css";
import ProductBoxIcon from "../assets/product-box.svg";
import CheckIcon from "../assets/check.svg";

const Wishlist = () => {
  const { wishlistItems, fetchWishlist, removeFromWishlist } =
    useContext(WishlistContext);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWishlistProducts();
  }, []);

  const loadWishlistProducts = async () => {
    try {
      setLoading(true);
      await fetchWishlist();
    } catch (error) {
      console.error("Error loading wishlist:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFromWishlist = async (productId) => {
    try {
      await removeFromWishlist(productId);
      setTimeout(() => {
        fetchWishlist().then(() => setLoading((prev) => !prev));
      }, 200);
    } catch (error) {
      console.error("Error removing from wishlist:", error);
      fetchWishlist();
    }
  };

  const getProductImage = (product) => {
    if (!product || !product.images || product.images.length === 0) {
      return "https://via.placeholder.com/300x300?text=No+Image";
    }
    const image = product.images[0];
    return image.startsWith("/uploads")
      ? "http://localhost:5000" + image
      : image;
  };

  if (loading) {
    return (
      <section className="wishlist-page">
        <div className="container">
          <div className="loading">
            <div className="loading-spinner"></div>
            <p>Loading your wishlist...</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="wishlist-page">
      <div className="container">
        <div className="wishlist-header">
          <h1>
            <span className="wishlist-title-icon">❤️</span>
            My Wishlist
          </h1>
          <p className="wishlist-subtitle">
            Save your favorite products for later
          </p>
        </div>

        {wishlistItems.length === 0 ? (
          <div className="wishlist-empty">
            <div className="empty-icon">🤍</div>
            <h3>Your wishlist is empty</h3>
            <p>Start adding products you love!</p>
            <Link to="/products" className="btn btn-primary">
              <span className="btn-icon">
                <img src={ProductBoxIcon} alt="Shop" className="btn-icon-svg" />
              </span>
              Browse Products
            </Link>
          </div>
        ) : (
          <>
            <div className="wishlist-stats-bar">
              <div className="wishlist-stat">
                <span className="stat-icon">
                  <img
                    src={ProductBoxIcon}
                    alt="Items"
                    className="stat-icon-svg"
                  />
                </span>
                <span className="stat-value">{wishlistItems.length}</span>
                <span className="stat-label">
                  Item{wishlistItems.length !== 1 ? "s" : ""}
                </span>
              </div>
              <div className="wishlist-actions">
                <Link to="/products" className="btn btn-outline btn-sm">
                  <span className="btn-icon">
                    <img src={CheckIcon} alt="Add" className="btn-icon-svg" />
                  </span>
                  Add More
                </Link>
                <Link to="/cart" className="btn btn-primary btn-sm">
                  <span className="btn-icon">
                    <img
                      src={ProductBoxIcon}
                      alt="Cart"
                      className="btn-icon-svg"
                    />
                  </span>
                  Move to Cart
                </Link>
              </div>
            </div>

            <div className="wishlist-grid" key={wishlistItems.length}>
              {wishlistItems.map((item, index) => {
                const product = item.product;
                if (!product) return null;

                return (
                  <div
                    key={product._id}
                    className="wishlist-card"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className="wishlist-card-image">
                      <Link to={`/product/${product._id}`}>
                        <img
                          src={getProductImage(product)}
                          alt={product.name}
                          onError={(e) => {
                            e.target.src =
                              "https://via.placeholder.com/300x300?text=No+Image";
                          }}
                        />
                      </Link>
                      <button
                        type="button"
                        className="remove-wishlist-btn"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleRemoveFromWishlist(product._id);
                        }}
                        title="Remove from wishlist"
                      >
                        ✕
                      </button>
                      {product.stock === 0 && (
                        <div className="out-of-stock-badge">
                          <span>⚠️</span> Out of Stock
                        </div>
                      )}
                    </div>

                    <div className="wishlist-card-info">
                      <Link
                        to={`/product/${product._id}`}
                        className="product-name-link"
                      >
                        <h3>{product.name}</h3>
                      </Link>

                      <div className="wishlist-card-category">
                        <span className="category-label">Category:</span>
                        <span className="category-value">
                          {product.category} - {product.variety}
                        </span>
                      </div>

                      <div className="wishlist-card-price-row">
                        <div className="wishlist-card-price">
                          <span className="currency">₹</span>
                          {product.price.toFixed(2)}
                        </div>
                        {product.stock > 0 ? (
                          <div className="stock-indicator in-stock">
                            <span className="dot"></span>
                            In Stock ({product.stock})
                          </div>
                        ) : (
                          <div className="stock-indicator out-of-stock">
                            <span className="dot"></span>
                            Out of Stock
                          </div>
                        )}
                      </div>

                      <div className="wishlist-card-actions">
                        <Link
                          to={`/product/${product._id}`}
                          className="btn btn-outline"
                        >
                          <span className="btn-icon">
                            <img
                              src={CheckIcon}
                              alt="View"
                              className="btn-icon-svg"
                            />
                          </span>
                          View
                        </Link>
                        {product.stock > 0 && (
                          <Link
                            to={`/product/${product._id}`}
                            className="btn btn-primary"
                          >
                            <span className="btn-icon">
                              <img
                                src={ProductBoxIcon}
                                alt="Cart"
                                className="btn-icon-svg"
                              />
                            </span>
                            Add to Cart
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </section>
  );
};

export default Wishlist;
