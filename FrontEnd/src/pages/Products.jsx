import React, { useState, useEffect, useRef } from "react";
import SearchBar from "../components/SearchBar";
import CategoryMenu from "../components/CategoryMenu";
import ProductCard from "../components/ProductCard";
import api from "../utils/api";
import "../styles/products.css";

const PRODUCTS_PER_PAGE = 8;

const Products = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const topRef = useRef(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    filterProducts();
  }, [searchTerm, products]);

  // Reset to page 1 whenever the filtered list changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filteredProducts.length, searchTerm]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get("/products");
      const data = Array.isArray(response.data)
        ? response.data
        : response.data.products || [];
      setProducts(data);
      setFilteredProducts(data);
    } catch (err) {
      console.error("Error fetching products:", err);
      setError("Failed to load products. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const filterProducts = () => {
    let filtered = products;
    if (searchTerm) {
      filtered = filtered.filter((p) =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }
    setFilteredProducts(filtered);
  };

  const handleCategorySelect = async ({ category, variety }) => {
    try {
      setLoading(true);
      const response = await api.get("/products/filter", {
        params: { category, variety },
      });
      setFilteredProducts(response.data);
      setCurrentPage(1);
    } catch (err) {
      console.error("Error filtering products:", err);
      setError("Failed to filter products.");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (term) => {
    setSearchTerm(term);
  };

  const scrollToTop = () => {
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    scrollToTop();
  };

  // Pagination math
  const totalPages = Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE);
  const startIdx = (currentPage - 1) * PRODUCTS_PER_PAGE;
  const pageItems = filteredProducts.slice(
    startIdx,
    startIdx + PRODUCTS_PER_PAGE,
  );

  // Build page number buttons: always show first, last, current ±1, with ellipsis
  const getPageNumbers = () => {
    if (totalPages <= 7)
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    const pages = new Set([
      1,
      totalPages,
      currentPage,
      currentPage - 1,
      currentPage + 1,
    ]);
    return [...pages]
      .filter((p) => p >= 1 && p <= totalPages)
      .sort((a, b) => a - b)
      .reduce((acc, p, i, arr) => {
        if (i > 0 && p - arr[i - 1] > 1) acc.push("...");
        acc.push(p);
        return acc;
      }, []);
  };

  if (loading) {
    return (
      <section className="products-page">
        <div className="container">
          <div className="loading">Loading products...</div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="products-page">
        <div className="container">
          <div className="error-message">{error}</div>
        </div>
      </section>
    );
  }

  return (
    <section className="products-page">
      <div className="container">
        <h1 ref={topRef}>Our Products</h1>

        <SearchBar onSearch={handleSearch} />
        <CategoryMenu onCategorySelect={handleCategorySelect} />

        {/* Result count */}
        {filteredProducts.length > 0 && (
          <p className="products-count">
            Showing {startIdx + 1}–
            {Math.min(startIdx + PRODUCTS_PER_PAGE, filteredProducts.length)} of{" "}
            {filteredProducts.length} products
          </p>
        )}

        <div className="products-grid">
          {pageItems.map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div className="no-products">
            <p>No products found matching your criteria.</p>
          </div>
        )}

        {/* Pagination bar */}
        {totalPages > 1 && (
          <div className="pagination">
            <div className="pagination-wrapper">
              {/* Prev */}
              <button
                className="page-btn page-nav"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                aria-label="Previous page"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M15 18l-6-6 6-6" />
                </svg>
                <span>Prev</span>
              </button>

              {/* Page numbers */}
              {getPageNumbers().map((p, i) =>
                p === "..." ? (
                  <span key={`ellipsis-${i}`} className="page-ellipsis">
                    …
                  </span>
                ) : (
                  <button
                    key={p}
                    className={`page-btn ${currentPage === p ? "active" : ""}`}
                    onClick={() => handlePageChange(p)}
                    aria-label={`Page ${p}`}
                    aria-current={currentPage === p ? "page" : undefined}
                  >
                    {p}
                  </button>
                ),
              )}

              {/* Next */}
              <button
                className="page-btn page-nav"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                aria-label="Next page"
              >
                <span>Next</span>
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </button>
            </div>

            {/* Pagination info */}
            <div className="pagination-info">
              <span>Page</span>
              <span className="page-indicator">
                {currentPage} of {totalPages}
              </span>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default Products;
