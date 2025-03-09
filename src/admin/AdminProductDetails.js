import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import '../css/adminProductPage.css';

const AdminProductDetails = () => {
  const [deletedImages, setDeletedImages] = useState([]);
  const navigate = useNavigate();
  const { productId } = useParams();
  const [product, setProduct] = useState(null);
  const [images, setImages] = useState([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [editedProduct, setEditedProduct] = useState(null);
  const [newImages, setNewImages] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const checkToken = useCallback(() => localStorage.getItem('adminToken') ? true : (navigate('/admin/login'), false), [navigate]);

  useEffect(() => {
    if (!checkToken()) return;

    const fetchProductDetails = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/products/details/${productId}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` },
        });
        if (!response.ok) throw new Error('Failed to fetch product details');

        const data = await response.json();
        const fullImageUrls = data.images.map((image) => `http://localhost:5000${image}`);
        setProduct({ ...data, images: fullImageUrls });
        setImages(fullImageUrls);

        if (!isEditing) setEditedProduct({ ...data, images: fullImageUrls });

        const [categoryData, brandData] = await Promise.all([
          fetch(`http://localhost:5000/api/category/${data.category_id}`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` },
          }).then((res) => res.json()),
          data.brand_id
            ? fetch(`http://localhost:5000/api/brand/${data.brand_id}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` },
              }).then((res) => res.json())
            : Promise.resolve({ name: 'Unspecified' }),
        ]);

        setProduct((prev) => ({ ...prev, category_name: categoryData.category_name, brand_name: brandData.name }));
      } catch (err) {
        console.error('Error fetching product details, category, or brand:', err);
        alert('Failed to fetch product details. Please try again.');
      }
    };

    fetchProductDetails();
  }, [productId, isEditing, checkToken]);

  const handleDeleteProduct = async () => {
    if (!checkToken()) return;

    try {
      const response = await fetch(`http://localhost:5000/api/products/${productId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` },
      });

      if (!response.ok) throw new Error('Failed to delete product');

      alert('Product deleted successfully');
      navigate(-1);
    } catch (err) {
      console.error('Error deleting product:', err);
      alert(err.message);
    }
  };

  const handleDeleteImage = (imagePath) => {
    setDeletedImages((prev) => [...prev, imagePath]);
    setEditedProduct((prev) => ({ ...prev, images: prev.images.filter((img) => img !== imagePath) }));
  };

  const handleAddImage = (e) => {
    const files = Array.from(e.target.files);
    const imageUrls = files.map((file) => URL.createObjectURL(file));
    setNewImages((prev) => [...prev, ...files]);
    setEditedProduct((prev) => ({ ...prev, images: [...prev.images, ...imageUrls] }));
  };

  const handleInputChange = (e) => setEditedProduct((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSaveChanges = async () => {
    if (!checkToken()) return;

    try {
      for (const imagePath of deletedImages) {
        const response = await fetch(`http://localhost:5000/api/products/${productId}/delete-image`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('adminToken')}` },
          body: JSON.stringify({ imagePath }),
        });

        if (!response.ok) throw new Error('Failed to delete image');
      }

      const formData = new FormData();
      formData.append('name', editedProduct.name);
      formData.append('description', editedProduct.description);
      formData.append('price', editedProduct.price);
      formData.append('stock', editedProduct.stock);

      editedProduct.images.forEach((img) => {
        if (!img.startsWith('blob:')) formData.append('existingImages', img.replace('http://localhost:5000', ''));
      });

      newImages.forEach((file) => formData.append('newImages', file));

      const updateResponse = await fetch(`http://localhost:5000/api/products/${productId}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` },
        body: formData,
      });

      if (!updateResponse.ok) throw new Error('Failed to update product');

      alert('Product updated successfully');
      setProduct(editedProduct);
      setIsEditing(false);
      setNewImages([]);
      setDeletedImages([]);
    } catch (err) {
      console.error('Error updating product:', err);
      alert(err.message);
    }
  };

  if (!product) return <p>Loading product details...</p>;

  return (
    <>
      <div className="admin-product-container">
        <div className="admin-product-image-section">
          <div className="admin-carousel-container">
            <button className="admin-carousel-btn admin-left" onClick={() => setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length)}>‹</button>
            <img className="admin-product-main-image" src={images[currentImageIndex]} alt={product.name} />
            <button className="admin-carousel-btn admin-right" onClick={() => setCurrentImageIndex((prev) => (prev + 1) % images.length)}>›</button>
          </div>

          <div className="admin-product-thumbnails">
            {editedProduct.images.filter(img => !deletedImages.includes(img)).map((img, index) => (
              <div key={index} className="admin-thumbnail-container">
                <img src={img} alt={`Thumbnail ${index + 1}`} className="admin-thumbnail" onClick={() => setCurrentImageIndex(index)} />
                {isEditing && !deletedImages.includes(img) && <span className="delete-icon" onClick={() => handleDeleteImage(img)}>−</span>}
              </div>
            ))}
            {isEditing && editedProduct.images.length < 20 && (
              <div className="admin-thumbnail-container add-thumbnail">
                <label className='custom-file-upload'>
                  <input type="file" multiple accept="image/*" onChange={handleAddImage} />
                  <span className="add-icon">+</span>
                </label>
              </div>
            )}
          </div>
        </div>

        <div className="admin-product-info-section">
          {isEditing ? (
            <>
              <input className="admin-product-title-edit" type="text" name="name" value={editedProduct.name} onChange={handleInputChange} />
              <input className="admin-price-edit" type="number" name="price" value={editedProduct.price} onChange={handleInputChange} />
            </>
          ) : (
            <>
              <h1 className="admin-product-title">{product.name}</h1>
              <div className="admin-product-price">
                <span className="admin-price">₱{parseFloat(product.price).toLocaleString()}</span>
              </div>
            </>
          )}

          <div className="admin-product-actions">
            {isEditing ? (
              <div className='buttons'>
                <button className="admin-save-btn" onClick={handleSaveChanges}>Save</button>
                <button className="admin-cancel-btn" onClick={() => { setIsEditing(false); setEditedProduct({ ...product, images: [...product.images] }); setImages([...product.images]); setNewImages([]); setDeletedImages([]); }}>Cancel</button>
              </div>
            ) : (
              <div className='buttons'>
                <button className="admin-edit-btn" onClick={() => setIsEditing(true)}>Edit</button>
                <button className="admin-delete-btn" onClick={() => setShowDeleteModal(true)}>Delete</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {showDeleteModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Confirm Deletion</h2>
            <p>Are you sure you want to delete this product? This action cannot be undone.</p>
            <div className="modal-buttons">
              <button className="confirm-btn" onClick={handleDeleteProduct}>Yes, Delete</button>
              <button className="cancel-btn" onClick={() => setShowDeleteModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      <div className="admin-product-description">
        <h2 className="admin-product-head">Product Specifications</h2>
        <p className="admin-product-info"><strong>Category:</strong> {product.category_name || "N/A"}</p>
        <p className="admin-product-info"><strong>Brand:</strong> {product.brand_name || "N/A"}</p>
        <p className="admin-product-info">
          <strong>Stock:</strong> {isEditing ? <input className="admin-stock-edit" type="number" name="stock" value={editedProduct.stock} onChange={handleInputChange} /> : product.stock || "0"}
        </p>
        <p className="admin-product-info">
          {isEditing ? <textarea className="admin-product-info-edit" name="description" value={editedProduct.description || ""} onChange={handleInputChange} /> : <span style={{ whiteSpace: "pre-wrap" }} dangerouslySetInnerHTML={{ __html: (product.description || "No description available.").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/&lt;(.*?)&gt;/g, "<strong>$1</strong>") }} />}
        </p>
      </div>
    </>
  );
};

export default AdminProductDetails;