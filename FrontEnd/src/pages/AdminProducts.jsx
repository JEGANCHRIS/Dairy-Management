import React, { useState, useEffect, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import api from "../utils/api";
import { success, error, confirm } from "../utils/toast.jsx";
import "../styles/adminproducts.css";
import ProductBoxIcon from "../assets/product-box.svg";
import CheckIcon from "../assets/check.svg";
import CrossMarkIcon from "../assets/cross-mark.svg";
import EditIcon from "../assets/edit.svg";
import DeleteIcon from "../assets/delete.svg";
import PlusIcon from "../assets/plus.svg";

const AdminProducts = () => {
  const { user } = useContext(AuthContext);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    category: "milk",
    variety: "",
    description: "",
    price: "",
    stock: "",
    isActive: true,
    images: [""],
    sizes: [
      { label: "Small", amount: 250, unit: "ml", priceMultiplier: 0.8 },
      { label: "Medium", amount: 500, unit: "ml", priceMultiplier: 1 },
      { label: "Large", amount: 1, unit: "L", priceMultiplier: 1.5 },
    ],
    nutritionalInfo: {
      calories: "",
      protein: "",
      carbohydrates: "",
      fat: "",
      fiber: "",
      sugar: "",
      sodium: "",
    },
  });
  const [imageFiles, setImageFiles] = useState([]);

  const categories = [
    { value: "milk", label: "Milk" },
    { value: "butter", label: "Butter" },
    { value: "cheese", label: "Cheese" },
    { value: "yogurt", label: "Yogurt" },
    { value: "paneer", label: "Paneer" },
    { value: "lassi", label: "Lassi" },
    { value: "milkshake", label: "Milkshake" },
    { value: "curd", label: "Curd" },
    { value: "cream", label: "Cream" },
    { value: "other", label: "Other" },
  ];

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await api.get("/products?showAll=true");
      setProducts(response.data.products || response.data);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (product = null) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name || "",
        category: product.category || "milk",
        variety: product.variety || "",
        description: product.description || "",
        price: product.price || "",
        stock: product.stock || "",
        isActive: product.isActive !== false,
        images:
          product.images && product.images.length > 0 ? product.images : [""],
        sizes:
          product.sizes && product.sizes.length > 0
            ? product.sizes
            : [
                {
                  label: "Small",
                  amount: 250,
                  unit: "ml",
                  priceMultiplier: 0.8,
                },
                {
                  label: "Medium",
                  amount: 500,
                  unit: "ml",
                  priceMultiplier: 1,
                },
                { label: "Large", amount: 1, unit: "L", priceMultiplier: 1.5 },
              ],
        nutritionalInfo: product.nutritionalInfo || {
          calories: "",
          protein: "",
          carbohydrates: "",
          fat: "",
          fiber: "",
          sugar: "",
          sodium: "",
        },
      });
      setImageFiles(
        product.images && product.images.length > 0
          ? product.images.map(() => null)
          : [null],
      );
    } else {
      setEditingProduct(null);
      setFormData({
        name: "",
        category: "milk",
        variety: "",
        description: "",
        price: "",
        stock: "",
        isActive: true,
        images: [""],
        sizes: [
          { label: "Small", amount: 250, unit: "ml", priceMultiplier: 0.8 },
          { label: "Medium", amount: 500, unit: "ml", priceMultiplier: 1 },
          { label: "Large", amount: 1, unit: "L", priceMultiplier: 1.5 },
        ],
        nutritionalInfo: {
          calories: "",
          protein: "",
          carbohydrates: "",
          fat: "",
          fiber: "",
          sugar: "",
          sodium: "",
        },
      });
      setImageFiles([null]);
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingProduct(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith("nutrition-")) {
      const nutritionKey = name.replace("nutrition-", "");
      setFormData((prev) => ({
        ...prev,
        nutritionalInfo: {
          ...prev.nutritionalInfo,
          [nutritionKey]: value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]:
          name === "price" || name === "stock"
            ? parseFloat(value) || ""
            : value,
      }));
    }
  };

  const handleSizeChange = (index, field, value) => {
    setFormData((prev) => {
      const newSizes = [...prev.sizes];
      newSizes[index] = {
        ...newSizes[index],
        [field]:
          field === "amount" || field === "priceMultiplier"
            ? parseFloat(value) || 0
            : value,
      };
      return { ...prev, sizes: newSizes };
    });
  };

  const addSize = () => {
    setFormData((prev) => ({
      ...prev,
      sizes: [
        ...prev.sizes,
        { label: "", amount: 0, unit: "ml", priceMultiplier: 1 },
      ],
    }));
  };

  const removeSize = (index) => {
    if (formData.sizes.length > 1) {
      setFormData((prev) => ({
        ...prev,
        sizes: prev.sizes.filter((_, i) => i !== index),
      }));
    }
  };

  const handleImageFileChange = (index, file) => {
    if (file) {
      const newFiles = [...imageFiles];
      newFiles[index] = file;
      setImageFiles(newFiles);

      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      const newImages = [...formData.images];
      newImages[index] = previewUrl;
      setFormData((prev) => ({ ...prev, images: newImages }));
    }
  };

  const uploadImage = async (file) => {
    const formDataUpload = new FormData();
    formDataUpload.append("image", file);

    console.log(
      "Uploading file:",
      file.name,
      "Size:",
      file.size,
      "Type:",
      file.type,
    );

    try {
      const response = await api.post("/upload/single", formDataUpload, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      console.log("Upload response:", response.data);
      return response.data.imageUrl;
    } catch (error) {
      console.error("Upload error details:", error);
      console.error("Upload error response:", error.response?.data);
      throw new Error(error.response?.data?.error || "Failed to upload image");
    }
  };

  const addImageField = () => {
    setFormData((prev) => ({ ...prev, images: [...prev.images, ""] }));
    setImageFiles((prev) => [...prev, null]);
  };

  const removeImageField = (index) => {
    if (formData.images.length > 1) {
      const newImages = formData.images.filter((_, i) => i !== index);
      const newFiles = imageFiles.filter((_, i) => i !== index);
      setFormData((prev) => ({ ...prev, images: newImages }));
      setImageFiles(newFiles);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setUploadingImages(true);

      // Upload all new image files
      const uploadedImages = [];
      for (let i = 0; i < imageFiles.length; i++) {
        if (imageFiles[i] && imageFiles[i] instanceof File) {
          console.log("Uploading image:", imageFiles[i].name);
          const imageUrl = await uploadImage(imageFiles[i]);
          console.log("Uploaded image URL:", imageUrl);
          uploadedImages.push(imageUrl);
        } else if (
          formData.images[i] &&
          !formData.images[i].startsWith("blob:")
        ) {
          // Keep existing image URLs (not blob URLs)
          console.log("Keeping existing image:", formData.images[i]);
          uploadedImages.push(formData.images[i]);
        }
      }

      // Filter out empty nutritional info values
      const nutritionalInfo = {};
      Object.entries(formData.nutritionalInfo).forEach(([key, value]) => {
        if (value && value !== "") {
          nutritionalInfo[key] = parseFloat(value);
        }
      });

      const submitData = {
        name: formData.name.trim(),
        category: formData.category,
        variety: formData.variety.trim(),
        description: formData.description.trim(),
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock),
        isActive: formData.isActive,
        images: uploadedImages.filter((img) => img && img.trim() !== ""),
        sizes: formData.sizes.filter((s) => s.label.trim() !== ""),
        nutritionalInfo:
          Object.keys(nutritionalInfo).length > 0 ? nutritionalInfo : undefined,
      };

      if (editingProduct && editingProduct._id) {
        // UPDATE existing product
        console.log("=== UPDATING PRODUCT ===");
        console.log("Product ID:", editingProduct._id);
        console.log("Submit data:", JSON.stringify(submitData, null, 2));

        const response = await api.put(
          `/products/${editingProduct._id}`,
          submitData,
        );
        console.log("=== PRODUCT UPDATED ===");
        console.log("Response:", response.data);

        success("Product updated successfully!");
      } else {
        // CREATE new product
        console.log("=== CREATING PRODUCT ===");
        console.log("Submit data:", JSON.stringify(submitData, null, 2));

        const response = await api.post("/products", submitData);
        console.log("=== PRODUCT CREATED ===");
        console.log("Response:", response.data);

        success("Product created successfully!");
      }

      handleCloseModal();
      fetchProducts();
    } catch (error) {
      console.error("=== ERROR SAVING PRODUCT ===");
      console.error("Full error:", error);
      console.error("Error response:", error.response?.data);
      console.error("Error status:", error.response?.status);

      const errorMsg =
        error.response?.data?.error ||
        error.response?.data?.message ||
        error.message ||
        "Failed to save product";
      console.error("Error message shown to user:", errorMsg);
      error(errorMsg);
    } finally {
      setUploadingImages(false);
    }
  };

  const handleDelete = async (id) => {
    confirm("Are you sure you want to delete this product?", async () => {
      try {
        await api.delete(`/products/${id}`);
        success("Product deleted successfully!");
        fetchProducts();
      } catch (error) {
        error("Failed to delete product");
      }
    });
  };

  const canManageProducts =
    user?.role === "admin" || user?.role === "superAdmin";

  if (!canManageProducts) {
    return (
      <div className="admin-products-page">
        <div className="container">
          <div className="access-denied">
            <h1>🚫 Access Denied</h1>
            <p>You don't have permission to manage products.</p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="admin-products-page">
        <div className="container">
          <div className="loading">Loading products...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-products-page">
      <div className="container">
        <div className="page-header">
          <div>
            <h1>
              <span className="emoji-icon">
                <img
                  src={ProductBoxIcon}
                  alt="Products"
                  className="emoji-icon-svg"
                />
              </span>{" "}
              Product Management
            </h1>
            <p>Manage your dairy products inventory</p>
          </div>
          <button className="btn-add-product" onClick={handleOpenModal}>
            <span className="btn-icon">
              <img src={PlusIcon} alt="Add" className="btn-icon-svg" />
            </span>{" "}
            Add New Product
          </button>
        </div>

        {products.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              <img
                src={ProductBoxIcon}
                alt="Empty"
                className="emoji-icon-svg-large"
              />
            </div>
            <h2>No Products Found</h2>
            <p>Start by adding your first product to the catalog.</p>
            <button className="btn-add-first" onClick={handleOpenModal}>
              <span className="btn-icon">
                <img src={PlusIcon} alt="Add" className="btn-icon-svg" />
              </span>{" "}
              Add First Product
            </button>
          </div>
        ) : (
          <div className="products-grid">
            {products.map((product) => (
              <div key={product._id} className="product-card">
                <div className="product-image">
                  <img
                    src={
                      product.images && product.images[0]
                        ? product.images[0].startsWith("http") ||
                          product.images[0].startsWith("/uploads")
                          ? product.images[0].startsWith("/uploads")
                            ? "http://localhost:5000" + product.images[0]
                            : product.images[0]
                          : product.images[0]
                        : "https://via.placeholder.com/300x300?text=No+Image"
                    }
                    alt={product.name}
                    onError={(e) => {
                      e.target.src =
                        "https://via.placeholder.com/300x300?text=No+Image";
                    }}
                  />
                </div>
                <div className="product-info">
                  <h3>{product.name}</h3>
                  <p className="product-category">
                    {product.category} - {product.variety}
                  </p>
                  <div className="product-price-row">
                    <p className="product-price">
                      ₹
                      {product.sizes && product.sizes.length > 0
                        ? Math.min(
                            ...product.sizes.map(
                              (s) => product.price * s.priceMultiplier,
                            ),
                          ).toFixed(2)
                        : product.price.toFixed(2)}
                      {product.sizes && product.sizes.length > 0 && (
                        <span className="price-starting-text"> starting</span>
                      )}
                    </p>
                    {product.sizes && product.sizes.length > 0 && (
                      <p className="product-sizes-preview">
                        {product.sizes
                          .map((s) => `${s.label} (${s.amount}${s.unit})`)
                          .join(" · ")}
                      </p>
                    )}
                  </div>
                  <p className="product-stock">
                    Stock:{" "}
                    <span
                      className={
                        product.stock > 0 ? "in-stock" : "out-of-stock"
                      }
                    >
                      {product.stock > 0
                        ? `${product.stock} units`
                        : "Out of Stock"}
                    </span>
                  </p>
                  <p className="product-status">
                    Status:{" "}
                    <span
                      className={
                        product.isActive !== false
                          ? "status-active"
                          : "status-inactive"
                      }
                    >
                      {product.isActive !== false ? "Active" : "Inactive"}
                    </span>
                  </p>
                  <div className="product-actions">
                    <button
                      className="btn-edit"
                      onClick={() => handleOpenModal(product)}
                    >
                      <img
                        src={EditIcon}
                        alt="Edit"
                        className="btn-icon-svg-small"
                      />{" "}
                      Edit
                    </button>
                    <button
                      className="btn-delete"
                      onClick={() => handleDelete(product._id)}
                    >
                      <img
                        src={DeleteIcon}
                        alt="Delete"
                        className="btn-icon-svg-small"
                      />{" "}
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingProduct ? "Edit Product" : "Add New Product"}</h2>
              <button className="btn-close" onClick={handleCloseModal}>
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="product-form">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="name">Product Name *</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    placeholder="e.g., Fresh Cow Milk"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="variety">Variety *</label>
                  <input
                    type="text"
                    id="variety"
                    name="variety"
                    value={formData.variety}
                    onChange={handleInputChange}
                    required
                    placeholder="e.g., Full Cream, Salted, Aged"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="category">Category *</label>
                  <select
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    required
                  >
                    {categories.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="price">Price (₹) *</label>
                  <input
                    type="number"
                    id="price"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    required
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="stock">Stock Quantity *</label>
                <input
                  type="number"
                  id="stock"
                  name="stock"
                  value={formData.stock}
                  onChange={handleInputChange}
                  required
                  min="0"
                  placeholder="0"
                />
              </div>

              <div className="form-group">
                <label>Product Status</label>
                <div className="status-toggle-row">
                  <button
                    type="button"
                    className={`status-toggle-btn ${formData.isActive ? "active" : "inactive"}`}
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        isActive: !prev.isActive,
                      }))
                    }
                  >
                    <span className="status-toggle-dot" />
                    {formData.isActive ? (
                      <>
                        <img
                          src={CheckIcon}
                          alt="Active"
                          className="status-toggle-icon-svg"
                        />{" "}
                        Active — visible to customers
                      </>
                    ) : (
                      <>
                        <img
                          src={CrossMarkIcon}
                          alt="Inactive"
                          className="status-toggle-icon-svg"
                        />{" "}
                        Inactive — hidden from store
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="description">Description *</label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                  rows="4"
                  placeholder="Describe your product..."
                />
              </div>

              {/* Sizes Section */}
              <div className="form-group sizes-section">
                <label className="sizes-section-label">
                  📏 Product Sizes & Units
                </label>
                <p className="sizes-help-text">
                  Define available sizes. Use <strong>ml/L</strong> for liquids,{" "}
                  <strong>g/kg</strong> for solids like paneer/butter,{" "}
                  <strong>pcs</strong> for pieces.
                </p>

                <div className="sizes-list">
                  {formData.sizes.map((size, index) => (
                    <div key={index} className="size-row">
                      <div className="size-row-field">
                        <label>Label</label>
                        <input
                          type="text"
                          value={size.label}
                          onChange={(e) =>
                            handleSizeChange(index, "label", e.target.value)
                          }
                          placeholder="e.g., Small, XL, XXL"
                        />
                      </div>
                      <div className="size-row-field">
                        <label>Amount</label>
                        <input
                          type="number"
                          value={size.amount}
                          onChange={(e) =>
                            handleSizeChange(index, "amount", e.target.value)
                          }
                          placeholder="e.g., 250"
                          min="0"
                          step="any"
                        />
                      </div>
                      <div className="size-row-field">
                        <label>Unit</label>
                        <select
                          value={size.unit}
                          onChange={(e) =>
                            handleSizeChange(index, "unit", e.target.value)
                          }
                        >
                          <option value="ml">ml (milliliter)</option>
                          <option value="L">L (liter)</option>
                          <option value="g">g (gram)</option>
                          <option value="kg">kg (kilogram)</option>
                          <option value="mg">mg (milligram)</option>
                          <option value="pcs">pcs (pieces)</option>
                        </select>
                      </div>
                      <div className="size-row-field">
                        <label>Price ×</label>
                        <input
                          type="number"
                          value={size.priceMultiplier}
                          onChange={(e) =>
                            handleSizeChange(
                              index,
                              "priceMultiplier",
                              e.target.value,
                            )
                          }
                          placeholder="1.0"
                          min="0.1"
                          step="0.1"
                        />
                      </div>
                      <div className="size-row-field size-price-preview">
                        <label>Preview</label>
                        <span>
                          ₹
                          {formData.price
                            ? (
                                parseFloat(formData.price) *
                                size.priceMultiplier
                              ).toFixed(2)
                            : "—"}
                        </span>
                      </div>
                      <button
                        type="button"
                        className="btn-remove-size"
                        onClick={() => removeSize(index)}
                        disabled={formData.sizes.length <= 1}
                        title="Remove size"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  className="btn-add-size"
                  onClick={addSize}
                >
                  ➕ Add Size
                </button>
              </div>

              {/* Nutritional Information Section */}
              <div className="form-group nutrition-section">
                <label className="nutrition-section-label">
                  🥗 Nutritional Information (per 100ml/100g)
                </label>
                <p className="nutrition-help-text">
                  Enter nutritional values. Leave blank if not applicable.
                </p>
                <div className="nutrition-grid">
                  <div className="nutrition-input-group">
                    <label htmlFor="nutrition-calories">Calories (kcal)</label>
                    <input
                      type="number"
                      id="nutrition-calories"
                      name="nutrition-calories"
                      value={formData.nutritionalInfo.calories}
                      onChange={handleInputChange}
                      placeholder="e.g., 60"
                      min="0"
                      step="0.1"
                    />
                  </div>
                  <div className="nutrition-input-group">
                    <label htmlFor="nutrition-protein">Protein (g)</label>
                    <input
                      type="number"
                      id="nutrition-protein"
                      name="nutrition-protein"
                      value={formData.nutritionalInfo.protein}
                      onChange={handleInputChange}
                      placeholder="e.g., 3.5"
                      min="0"
                      step="0.1"
                    />
                  </div>
                  <div className="nutrition-input-group">
                    <label htmlFor="nutrition-carbohydrates">
                      Carbohydrates (g)
                    </label>
                    <input
                      type="number"
                      id="nutrition-carbohydrates"
                      name="nutrition-carbohydrates"
                      value={formData.nutritionalInfo.carbohydrates}
                      onChange={handleInputChange}
                      placeholder="e.g., 5.0"
                      min="0"
                      step="0.1"
                    />
                  </div>
                  <div className="nutrition-input-group">
                    <label htmlFor="nutrition-fat">Fat (g)</label>
                    <input
                      type="number"
                      id="nutrition-fat"
                      name="nutrition-fat"
                      value={formData.nutritionalInfo.fat}
                      onChange={handleInputChange}
                      placeholder="e.g., 3.8"
                      min="0"
                      step="0.1"
                    />
                  </div>
                  <div className="nutrition-input-group">
                    <label htmlFor="nutrition-fiber">Fiber (g)</label>
                    <input
                      type="number"
                      id="nutrition-fiber"
                      name="nutrition-fiber"
                      value={formData.nutritionalInfo.fiber}
                      onChange={handleInputChange}
                      placeholder="e.g., 0.5"
                      min="0"
                      step="0.1"
                    />
                  </div>
                  <div className="nutrition-input-group">
                    <label htmlFor="nutrition-sugar">Sugar (g)</label>
                    <input
                      type="number"
                      id="nutrition-sugar"
                      name="nutrition-sugar"
                      value={formData.nutritionalInfo.sugar}
                      onChange={handleInputChange}
                      placeholder="e.g., 5.0"
                      min="0"
                      step="0.1"
                    />
                  </div>
                  <div className="nutrition-input-group">
                    <label htmlFor="nutrition-sodium">Sodium (mg)</label>
                    <input
                      type="number"
                      id="nutrition-sodium"
                      name="nutrition-sodium"
                      value={formData.nutritionalInfo.sodium}
                      onChange={handleInputChange}
                      placeholder="e.g., 50"
                      min="0"
                      step="0.1"
                    />
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label>Product Images</label>
                <p className="image-help-text">
                  Upload images from your computer (JPEG, PNG, WEBP - Max 5MB
                  each)
                </p>
                {formData.images.map((image, index) => (
                  <div key={index} className="image-input-group">
                    <div className="image-preview-container">
                      {image && (
                        <img
                          src={
                            image.startsWith("/uploads")
                              ? "http://localhost:5000" + image
                              : image
                          }
                          alt={`Preview ${index + 1}`}
                          className="image-preview"
                          onError={(e) => {
                            e.target.src =
                              "https://via.placeholder.com/100x100?text=No+Image";
                          }}
                        />
                      )}
                    </div>
                    <input
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      onChange={(e) =>
                        handleImageFileChange(index, e.target.files[0])
                      }
                      className="file-input"
                    />
                    {formData.images.length > 1 && (
                      <button
                        type="button"
                        className="btn-remove-image"
                        onClick={() => removeImageField(index)}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  className="btn-add-image"
                  onClick={addImageField}
                >
                  📷 + Add Another Image
                </button>
              </div>

              {uploadingImages && (
                <div className="upload-progress">
                  <div className="upload-progress-text">
                    <span className="upload-spinner"></span>
                    Uploading images... Please wait
                  </div>
                </div>
              )}

              <div className="form-actions">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={handleCloseModal}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-submit"
                  disabled={uploadingImages}
                >
                  {uploadingImages
                    ? "Uploading..."
                    : editingProduct
                      ? "Update Product"
                      : "Save Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProducts;
