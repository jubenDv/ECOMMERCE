import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const AdminEditProduct = ({ product, setProduct, setEditMode }) => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const [updatedProduct, setUpdatedProduct] = useState({ ...product, images: product.images || [] });
  const [newImages, setNewImages] = useState([]);

  const checkToken = useCallback(() => localStorage.getItem('adminToken') ? true : (navigate('/admin/login'), false), [navigate]);

  useEffect(() => { checkToken() && setUpdatedProduct({ ...product, images: product.images || [] }); }, [product, checkToken]);

  const handleChange = (e) => setUpdatedProduct({ ...updatedProduct, [e.target.name]: e.target.value });
  const handleImageChange = (e) => setNewImages([...newImages, ...Array.from(e.target.files)]);

  const handleDeleteImage = async (imagePath) => {
    if (!checkToken()) return;
    try {
      const response = await fetch(`http://localhost:5000/api/products/${productId}/delete-image`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('adminToken')}` },
        body: JSON.stringify({ imagePath }),
      });
      if (!response.ok) throw new Error('Failed to delete image');
      setUpdatedProduct(prev => ({ ...prev, images: prev.images.filter(img => img !== imagePath) }));
    } catch (err) {
      console.error('Error deleting image:', err);
      alert(err.message);
    }
  };

  const handleSaveChanges = async () => {
    if (!checkToken()) return; // Only check for token validation
  
    const formData = new FormData();
    Object.entries(updatedProduct).forEach(([key, value]) => 
      key === 'images' ? value.forEach(img => formData.append('existingImages', img)) : formData.append(key, value)
    );
    newImages.forEach(file => formData.append('newImages', file));
  
    try {
      const response = await fetch(`http://localhost:5000/api/products/${productId}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` },
        body: formData,
      });
      if (!response.ok) throw new Error('Failed to update product');
      alert('Product updated successfully');
      setEditMode(false);
    } catch (err) {
      console.error('Error updating product:', err);
      alert(err.message);
    }
  };

  return (
    <div className="admin-edit-product">
      {['name', 'description', 'price', 'stock'].map(field => (
        <label key={field}>{field.charAt(0).toUpperCase() + field.slice(1)}:
          {field === 'description' ? <textarea name={field} value={updatedProduct[field]} onChange={handleChange} /> : <input type={field === 'price' || field === 'stock' ? 'number' : 'text'} name={field} value={updatedProduct[field]} onChange={handleChange} />}
        </label>
      ))}
      <label>Current Images:
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {updatedProduct.images.map((img, index) => (
            <div key={index} style={{ position: 'relative' }}>
              <img src={`http://localhost:5000${img}`} alt="Product" style={{ width: '100px', height: '100px' }} />
              <button style={{ position: 'absolute', top: 0, right: 0, background: 'red', color: 'white' }} onClick={() => handleDeleteImage(img)}>X</button>
            </div>
          ))}
        </div>
      </label>
      <label>Upload New Images: <input type="file" accept="image/*" multiple onChange={handleImageChange} /></label>
      <button onClick={handleSaveChanges}>Save Changes</button>
      <button onClick={() => setEditMode(false)}>Cancel</button>
    </div>
  );
};

export default AdminEditProduct;