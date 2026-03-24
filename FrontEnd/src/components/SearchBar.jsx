import React, { useState } from "react";
import "../styles/products.css";

const SearchBar = ({ onSearch }) => {
  const [searchTerm, setSearchTerm] = useState("");

  const handleChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    onSearch(value);
  };

  return (
    <div className="search-bar">
      <input
        type="text"
        id="search"
        name="search"
        placeholder="Search products..."
        value={searchTerm}
        onChange={handleChange}
        autoComplete="off"
      />
    </div>
  );
};

export default SearchBar;
