import React, { useContext, useState } from "react";
import { Link } from "react-router-dom";
import { CartContext } from "../context/CartContext";
import { WishlistContext } from "../context/WishlistContext";
import "../styles/products.css";
import HeartColorfullIcon from "../assets/heart-colorfull.svg";
import HeartColorlessIcon from "../assets/heart-colorless.svg";
import CartIcon from "../assets/shopping-cart.svg";

const ProductCard = ({ product }) => {
  const { addToCart } = useContext(CartContext);
  const { toggleWishlist, isInWishlist } = useContext(WishlistContext);
  const [wishlistLoading, setWishlistLoading] = useState(false);

  const isOutOfStock = product.stock === 0;
  const inWishlist = isInWishlist(product._id);

  const imageUrl =
    product.images && product.images[0]
      ? product.images[0].startsWith("/uploads")
        ? "http://localhost:5000" + product.images[0]
        : product.images[0]
      : "https://via.placeholder.com/300x300?text=No+Image";

  const handleWishlistToggle = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!localStorage.getItem("token")) {
      alert("Please login to add items to wishlist");
      return;
    }

    setWishlistLoading(true);
    await toggleWishlist(product._id);
    setWishlistLoading(false);
  };

  return (
    <div className={`product-card ${isOutOfStock ? "out-of-stock" : ""}`}>
      <Link to={`/product/${product._id}`}>
        <div className="product-image">
          <img
            src={imageUrl}
            alt={product.name}
            onError={(e) => {
              e.target.src =
                "https://via.placeholder.com/300x300?text=No+Image";
            }}
          />
        </div>
      </Link>

      <div className="product-info">
        <Link to={`/product/${product._id}`}>
          <h3>{product.name}</h3>
        </Link>

        <div className="product-category">
          {product.category} - {product.variety}
        </div>

        <div className="product-price-row">
          <div className="product-price">₹{product.price.toFixed(2)}</div>
          <button
            className={`wishlist-btn ${inWishlist ? "active" : ""}`}
            onClick={handleWishlistToggle}
            disabled={wishlistLoading}
            title={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
          >
            {inWishlist ? (
              <img
                src={HeartColorfullIcon}
                alt="Liked"
                className="wishlist-icon-svg"
              />
            ) : (
              <img
                src={HeartColorlessIcon}
                alt="Like"
                className="wishlist-icon-svg"
              />
            )}
          </button>
        </div>

        <div className="product-stock">
          {isOutOfStock ? (
            <span className="out-of-stock-text">Out of Stock</span>
          ) : (
            <span className="in-stock">In Stock: {product.stock}</span>
          )}
        </div>

        <button
          className="add-to-cart-btn"
          onClick={() => addToCart(product)}
          disabled={isOutOfStock}
        >
          {isOutOfStock ? "Out of Stock" : "Add to Cart"}
          {!isOutOfStock && (
            <img src={CartIcon} alt="Cart" className="add-to-cart-icon-svg" />
          )}
        </button>
      </div>
    </div>
  );
};

export default ProductCard;
