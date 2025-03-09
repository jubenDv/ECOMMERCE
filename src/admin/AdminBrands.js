import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

const AdminBrands = () => {
  const [brands, setBrands] = useState([]);
  const [newBrandName, setNewBrandName] = useState('');
  const [newBrandImage, setNewBrandImage] = useState(null);
  const [editBrandId, setEditBrandId] = useState(null);
  const [editBrandName, setEditBrandName] = useState('');
  const [editBrandImage, setEditBrandImage] = useState(null);
  const navigate = useNavigate();

  const checkToken = useCallback(() => {
    if (!localStorage.getItem('adminToken')) {
      navigate('/admin/login');
      return false;
    }
    return true;
  }, [navigate]);

  useEffect(() => {
    if (!checkToken()) return;
    fetch('http://localhost:5000/api/brand', {
      headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` },
    })
      .then((res) => res.json())
      .then(setBrands)
      .catch(() => {});
  }, [checkToken]);

  const handleBrandAction = (url, method, body, onSuccess) => {
    if (!checkToken()) return;
    fetch(url, {
      method,
      headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` },
      body,
    })
      .then((res) => res.json())
      .then(onSuccess)
      .catch(() => {});
  };

  const handleAddBrand = () => {
    if (!newBrandName || !newBrandImage) return;
    const formData = new FormData();
    formData.append('name', newBrandName);
    formData.append('image', newBrandImage);
    handleBrandAction('http://localhost:5000/api/brand', 'POST', formData, (data) => {
      setBrands([...brands, data]);
      setNewBrandName('');
      setNewBrandImage(null);
    });
  };

  const handleSaveEditBrand = () => {
    if (!editBrandName) return;
    const formData = new FormData();
    formData.append('name', editBrandName);
    if (editBrandImage) formData.append('image', editBrandImage);
    handleBrandAction(`http://localhost:5000/api/brand/${editBrandId}/edit`, 'PUT', formData, (data) => {
      setBrands(brands.map((b) => (b.id === editBrandId ? data : b)));
      setEditBrandId(null);
      setEditBrandName('');
      setEditBrandImage(null);
    });
  };

  const handleDeleteBrand = (id) => {
    handleBrandAction(`http://localhost:5000/api/brand/${id}/delete`, 'DELETE', null, () => {
      setBrands(brands.filter((b) => b.id !== id));
    });
  };

  return (
    <div>
      <h3>Add New Brand</h3>
      <input type="text" placeholder="Enter brand name" value={newBrandName} onChange={(e) => setNewBrandName(e.target.value)} />
      <input type="file" accept="image/*" onChange={(e) => setNewBrandImage(e.target.files[0])} />
      <button onClick={handleAddBrand} style={{ color: 'green' }}>Add Brand</button>

      <h3>Manage Brands</h3>
      <table border="1" cellPadding="10" style={{ borderCollapse: 'collapse', width: '100%' }}>
        <thead>
          <tr>
            <th>ID</th>
            <th>Brand Name</th>
            <th>Image</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {brands.map((brand) => (
            <tr key={brand.id}>
              <td>{brand.id}</td>
              <td>
                {editBrandId === brand.id ? (
                  <input type="text" value={editBrandName} onChange={(e) => setEditBrandName(e.target.value)} />
                ) : (
                  <span>{brand.name}</span>
                )}
              </td>
              <td>
                <img src={`http://localhost:5000${brand.image_path}`} alt={brand.name} width="50" height="50" />
              </td>
              <td>
                {editBrandId === brand.id ? (
                  <>
                    <button onClick={handleSaveEditBrand} style={{ color: 'green' }}>Save</button>
                    <button onClick={() => setEditBrandId(null)} style={{ color: 'gray', marginLeft: '10px' }}>Cancel</button>
                  </>
                ) : (
                  <>
                    <button onClick={() => { setEditBrandId(brand.id); setEditBrandName(brand.name); }} style={{ color: 'blue' }}>Edit</button>
                    <button onClick={() => handleDeleteBrand(brand.id)} style={{ color: 'red', marginLeft: '10px' }}>Delete</button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AdminBrands;