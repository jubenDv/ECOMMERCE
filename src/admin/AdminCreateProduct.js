import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

const AdminCreateProduct = () => {
  const { categoryId } = useParams();
  const navigate = useNavigate();
  const [productData, setProductData] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    brandId: '',
  });
  const [brands, setBrands] = useState([]);
  const [categoryName, setCategoryName] = useState('');
  const [loading, setLoading] = useState(true);

  // Reusable function to check token
  const checkToken = useCallback(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/admin/login');
      return false;
    }
    return true;
  }, [navigate]);

  // Fetch brand list and category details
  useEffect(() => {
    if (!checkToken()) return;

    setLoading(true);
    Promise.all([
      fetch('http://localhost:5000/api/brand', {
        headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` },
      }),
      fetch(`http://localhost:5000/api/category/${categoryId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` },
      }),
    ])
      .then(([brandRes, categoryRes]) => {
        if (!brandRes.ok || !categoryRes.ok) throw new Error('Failed to fetch data');
        return Promise.all([brandRes.json(), categoryRes.json()]);
      })
      .then(([brandData, categoryData]) => {
        setBrands(brandData);
        setCategoryName(categoryData.category_name);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error fetching data:', error);
        alert('Failed to fetch data. Please try again.');
        setLoading(false);
      });
  }, [categoryId, checkToken]);

  const handleChange = (e) => {
    setProductData({ ...productData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!checkToken()) return;

    fetch(`http://localhost:5000/api/category/${categoryId}/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('adminToken')}`,
      },
      body: JSON.stringify(productData),
    })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to add product');
        return res.json();
      })
      .then(() => navigate(`/admin/category/${categoryId}`))
      .catch((error) => {
        console.error('Error adding product:', error);
        alert('Failed to add product. Please try again.');
      });
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h2>Add New Product</h2>
      <form onSubmit={handleSubmit}>
        <input type="text" name="name" placeholder="Product Name" onChange={handleChange} required />
        <textarea name="description" placeholder="Description" onChange={handleChange} required />
        <input type="number" name="price" placeholder="Price" onChange={handleChange} required />
        <input type="number" name="stock" placeholder="Stock" onChange={handleChange} required />
        
        {/* Display category name in a non-editable input */}
        <input type="text" name="categoryName" value={categoryName} disabled placeholder="Category" />

        {/* Brand Selection */}
        <select name="brandId" value={productData.brandId} onChange={handleChange} required>
          <option value="" disabled>Select Brand</option>
          {brands.map((brand) => (
            <option key={brand.id} value={brand.id}>{brand.name}</option>
          ))}
        </select>

        <button type="submit">Add Product</button>
      </form>
    </div>
  );
};

export default AdminCreateProduct;