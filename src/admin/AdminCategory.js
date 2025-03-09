import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

const AdminCategory = () => {
  const [category, setCategory] = useState([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryImage, setNewCategoryImage] = useState(null);
  const [editCategoryId, setEditCategoryId] = useState(null);
  const [editCategoryName, setEditCategoryName] = useState('');
  const [editCategoryImage, setEditCategoryImage] = useState(null);
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

    fetch('http://localhost:5000/api/category', {
      headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` },
    })
      .then((res) => res.json())
      .then((data) => setCategory(data))
      .catch((err) => console.error('Error fetching category:', err));
  }, [checkToken]);

  const handleAddCategory = () => {
    if (!checkToken() || !newCategoryName || !newCategoryImage) return alert('Category name and image are required');

    const formData = new FormData();
    formData.append('name', newCategoryName);
    formData.append('image', newCategoryImage);

    fetch('http://localhost:5000/api/category', {
      method: 'POST',
      headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` },
      body: formData,
    })
      .then((res) => res.json())
      .then((data) => {
        setCategory([...category, data]);
        setNewCategoryName('');
        setNewCategoryImage(null);
      })
      .catch((err) => console.error('Error adding category:', err));
  };

  const handleEditCategory = (categoryId, categoryName) => {
    if (!checkToken()) return;
    setEditCategoryId(categoryId);
    setEditCategoryName(categoryName);
  };

  const handleSaveEdit = () => {
    if (!checkToken() || !editCategoryName) return alert('Category name is required');

    const formData = new FormData();
    formData.append('name', editCategoryName);
    if (editCategoryImage) formData.append('image', editCategoryImage);

    fetch(`http://localhost:5000/api/category/${editCategoryId}/edit`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` },
      body: formData,
    })
      .then((res) => res.json())
      .then((data) => {
        setCategory(category.map((cat) => (cat.id === editCategoryId ? data : cat)));
        setEditCategoryId(null);
        setEditCategoryName('');
        setEditCategoryImage(null);
      })
      .catch((err) => console.error('Error updating category:', err));
  };

  const handleDeleteCategory = (categoryId) => {
    if (!checkToken()) return;

    fetch(`http://localhost:5000/api/category/${categoryId}/delete`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.error) alert(data.error);
        else setCategory(category.filter((cat) => cat.id !== categoryId));
      })
      .catch((err) => console.error('Error deleting category:', err));
  };

  return (
    <div>
      <h3>Add New Category</h3>
      <input type="text" placeholder="Category Name" value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} />
      <input type="file" accept="image/*" onChange={(e) => setNewCategoryImage(e.target.files[0])} />
      <button onClick={handleAddCategory}>Add Category</button>

      <h3>Manage Categories</h3>
      <table border="1" cellPadding="10" style={{ borderCollapse: 'collapse', width: '100%' }}>
        <thead>
          <tr>
            <th>ID</th>
            <th>Category Name</th>
            <th>Image</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {category.map((cat) => (
            <tr key={cat.id}>
              <td>{cat.id}</td>
              <td>
                {editCategoryId === cat.id ? (
                  <input type="text" value={editCategoryName} onChange={(e) => setEditCategoryName(e.target.value)} />
                ) : (
                  <span onClick={() => navigate(`/admin/category/${cat.id}`)} style={{ cursor: 'pointer', color: 'blue', textDecoration: 'underline' }}>
                    {cat.name}
                  </span>
                )}
              </td>
              <td><img src={cat.image_path} alt={cat.name} className="homepage-product-image" /></td>
              <td>
                {editCategoryId === cat.id ? (
                  <>
                    <button onClick={handleSaveEdit} style={{ color: 'green' }}>Save</button>
                    <button onClick={() => setEditCategoryId(null)} style={{ color: 'gray', marginLeft: '10px' }}>Cancel</button>
                  </>
                ) : (
                  <>
                    <button onClick={() => handleEditCategory(cat.id, cat.name)} style={{ color: 'blue' }}>Edit</button>
                    <button onClick={() => handleDeleteCategory(cat.id)} style={{ color: 'red', marginLeft: '10px' }}>Delete</button>
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

export default AdminCategory;