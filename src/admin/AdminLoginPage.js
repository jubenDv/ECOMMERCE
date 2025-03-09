import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const AdminLoginPage = ({ setAdminToken }) => {
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:5000/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();

      if (res.ok) {
        localStorage.setItem('adminToken', data.token);
        setAdminToken(data.token);
        navigate('/admin/dashboard');
      } else {
        setError(data.error || 'Login failed.');
      }
    } catch {
      setError('Something went wrong. Please try again.');
    }
  };

  return (
    <div className="admin-auth">
      <h2>Admin Login</h2>
      <form onSubmit={handleLogin}>
        {['username', 'password'].map((field) => (
          <input key={field} type={field} placeholder={field} value={formData[field]} 
                 onChange={(e) => setFormData({ ...formData, [field]: e.target.value })} required />
        ))}
        <button type="submit">Login</button>
      </form>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
};

export default AdminLoginPage;
