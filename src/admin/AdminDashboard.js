import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../css/admindashboard.css';

const AdminDashboard = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/admin/login');
      return;
    }
  }, [navigate]);

  return (
    <div>
      <h2>Admin Dashboard</h2>
    </div>
  );
};

export default AdminDashboard;