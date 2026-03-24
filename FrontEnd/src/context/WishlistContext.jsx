import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../utils/api';

export const WishlistContext = createContext();

export const WishlistProvider = ({ children }) => {
  const [wishlistItems, setWishlistItems] = useState([]);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [loading, setLoading] = useState(false);

  // Fetch wishlist on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetchWishlist();
    }
  }, []);

  // Fetch wishlist from API
  const fetchWishlist = async () => {
    try {
      setLoading(true);
      const response = await api.get('/wishlist');
      setWishlistItems(response.data.items || []);
      setWishlistCount(response.data.count || 0);
    } catch (error) {
      console.error('Error fetching wishlist:', error);
    } finally {
      setLoading(false);
    }
  };

  // Add product to wishlist
  const addToWishlist = async (productId) => {
    try {
      const response = await api.post('/wishlist/add', { productId });
      setWishlistItems(response.data.items || []);
      setWishlistCount(response.data.count || 0);
      return { success: true };
    } catch (error) {
      console.error('Error adding to wishlist:', error);
      return { 
        success: false, 
        error: error.response?.data?.error || 'Failed to add to wishlist' 
      };
    }
  };

  // Remove product from wishlist
  const removeFromWishlist = async (productId) => {
    try {
      const response = await api.delete(`/wishlist/remove/${productId}`);
      setWishlistItems(response.data.items || []);
      setWishlistCount(response.data.count || 0);
      return { success: true };
    } catch (error) {
      console.error('Error removing from wishlist:', error);
      return { 
        success: false, 
        error: error.response?.data?.error || 'Failed to remove from wishlist' 
      };
    }
  };

  // Toggle wishlist status
  const toggleWishlist = async (productId) => {
    const isInWishlist = wishlistItems.some(item => item.product?._id === productId);
    
    if (isInWishlist) {
      return await removeFromWishlist(productId);
    } else {
      return await addToWishlist(productId);
    }
  };

  // Check if product is in wishlist
  const isInWishlist = (productId) => {
    return wishlistItems.some(item => item.product?._id === productId || item.product === productId);
  };

  return (
    <WishlistContext.Provider value={{
      wishlistItems,
      wishlistCount,
      loading,
      fetchWishlist,
      addToWishlist,
      removeFromWishlist,
      toggleWishlist,
      isInWishlist
    }}>
      {children}
    </WishlistContext.Provider>
  );
};
