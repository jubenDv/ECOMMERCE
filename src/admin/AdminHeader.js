import React from 'react';
import { useNavigate, Link } from 'react-router-dom';

const AdminHeader = ({ setAdminToken }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('adminToken'); // ✅ Remove adminToken from storage
    setAdminToken(null); // ✅ Reset state
    navigate('/admin/login'); // ✅ Redirect to admin login page
  };

  return (
    <header className="admin-header">
      <h1>Admin Panel</h1>
      <nav>
        <ul style={{ listStyle: 'none', display: 'flex', gap: '20px', padding: '0' }}>
          <li>
            <Link to="/admin/dashboard">Home</Link>
          </li>
          <li>
            <Link to="/admin/category">Manage Categories</Link>
          </li>
          <li>
            <Link to="/admin/brands">Manage Brands</Link>
          </li>
          <li>
            <Link to="/admin/carousel">Manage Carousel</Link>
          </li>
          <li style={{ cursor: 'pointer', color: 'blue' }} onClick={handleLogout}>
            Logout
          </li>
        </ul>
      </nav>
    </header>
  );
};

export default AdminHeader;