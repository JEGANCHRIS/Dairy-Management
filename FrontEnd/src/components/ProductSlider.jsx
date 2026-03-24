import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import api from '../utils/api';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import '../styles/products.css';

const ProductSlider = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchLatestProducts();
  }, []);

  const fetchLatestProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/products/latest?limit=8');
      console.log('Fetched products:', response.data);
      setProducts(response.data);
    } catch (error) {
      console.error('Error fetching latest products:', error);
      setError('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <section className="product-slider">
        <div className="container">
          <h2>New Arrivals</h2>
          <div className="loading">Loading products...</div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="product-slider">
        <div className="container">
          <h2>New Arrivals</h2>
          <div className="error-message">{error}</div>
        </div>
      </section>
    );
  }

  if (products.length === 0) {
    return (
      <section className="product-slider">
        <div className="container">
          <h2>New Arrivals</h2>
          <div className="no-products">No products available</div>
        </div>
      </section>
    );
  }

  return (
    <section className="product-slider">
      <div className="container">
        <h2>New Arrivals</h2>

        <Swiper
          modules={[Navigation, Pagination, Autoplay]}
          spaceBetween={15}
          slidesPerView={1}
          breakpoints={{
            0: {
              slidesPerView: 1,
              spaceBetween: 15,
            },
            320: {
              slidesPerView: 1,
              spaceBetween: 15,
            },
            425: {
              slidesPerView: 1,
              spaceBetween: 18,
            },
            640: {
              slidesPerView: 2,
              spaceBetween: 20,
            },
            768: {
              slidesPerView: 3,
              spaceBetween: 25,
            },
            1024: {
              slidesPerView: 4,
              spaceBetween: 30,
            },
          }}
          navigation
          pagination={{ clickable: true }}
          autoplay={{
            delay: 3000,
            disableOnInteraction: false,
          }}
          loop={true}
          grabCursor={true}
          watchOverflow={true}
        >
          {products.map((product) => (
            <SwiperSlide key={product._id}>
              <div className="slider-item">
                <Link to={`/product/${product._id}`}>
                  <div className="product-image">
                    <img
                      src={product.images && product.images[0]
                        ? (product.images[0].startsWith('/uploads')
                          ? 'http://localhost:5000' + product.images[0]
                          : product.images[0])
                        : 'https://via.placeholder.com/500x500?text=No+Image'}
                      alt={product.name}
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/500x500?text=No+Image';
                      }}
                    />
                  </div>
                  <div className="product-info">
                    <h4>{product.name}</h4>
                    <p className="product-price">₹{product.price}</p>
                  </div>
                </Link>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </section>
  );
};

export default ProductSlider;