import React, { useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import HomePage from './pages/HomePage';
import CategoryPage from './pages/CategoryPage';
import ProductPage from './pages/ProductPage';
import CartPage from './pages/CartPage';
import Header from './components/Header';
import Footer from './components/Footer';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import BrandPage from './pages/BrandPage';
import ProductBrand from './pages/ProductBrand';
import AdminLoginPage from './admin/AdminLoginPage';
import AdminDashboard from './admin/AdminDashboard';
import AdminRoutes from './admin/AdminRoutes';
import AdminCategoryPage from './admin/AdminCategoryPage';
import AdminHeader from './admin/AdminHeader';
import AdminCreateProduct from './admin/AdminCreateProduct';
import AdminProductDetails from './admin/AdminProductDetails';
import AdminCategory from './admin/AdminCategory';
import AdminBrands from './admin/AdminBrands';
import AdminCarousel from './admin/AdminCarousel';
import AdminCategoryDetails from './admin/AdminCategory';


const App = () => {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [adminToken, setAdminToken] = useState(localStorage.getItem('adminToken'));

  const location = useLocation();

  const handleSetToken = (newToken) => {
    setToken(newToken);
    newToken ? localStorage.setItem('token', newToken) : localStorage.removeItem('token');
  };

  const handleSetAdminToken = (newToken) => {
    setAdminToken(newToken);
    newToken ? localStorage.setItem('adminToken', newToken) : localStorage.removeItem('adminToken');
  };

  const isAdminRoute = location.pathname.startsWith('/admin');
  const isAdminLogin = location.pathname === '/admin/login';

  return (
    <div className="App">
      {!isAdminRoute && <Header token={token} setToken={handleSetToken} />} {/* ✅ Show Header for user routes */}
      {!isAdminLogin && isAdminRoute && <AdminHeader setAdminToken={setAdminToken} />} {/* ✅ Admin Header */}

      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={token ? <Navigate to="/" /> : <LoginPage setToken={handleSetToken} />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/category/:categoryId" element={<CategoryPage />} />
        <Route path="/product/:productId" element={<ProductPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/brands" element={<BrandPage />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/*" element={<AdminDashboard />} />
        <Route path="/brand/:brandId" element={<ProductBrand />} />
        <Route path="/admin/category/:categoryId" element={<AdminCategoryPage />} />
        <Route path="/admin/category/:categoryId/add-product" element={<AdminCreateProduct />} />
        <Route path="/admin/login" element={<AdminLoginPage setAdminToken={handleSetAdminToken} />} />
        <Route path="/admin/products/:productId" element={<AdminProductDetails />} />
        <Route element={<AdminRoutes adminToken={adminToken} />}>
        <Route path="/admin/dashboard" element={<AdminDashboard />} /> {/* ✅ Corrected Indentation */}
        </Route>
        <Route path="/admin/category" element={<AdminCategory />} />
        <Route path="/category/:categoryId" element={<AdminCategoryDetails />} />
        <Route path="/admin/brands" element={<AdminBrands />} />
        <Route path="/admin/carousel" element={<AdminCarousel />} />
      </Routes>

      {!isAdminRoute && <Footer />} {/* ✅ Show Footer only for user routes */}
    </div>
  );
};

export default App;
