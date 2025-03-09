import { Navigate, Outlet } from 'react-router-dom';

const AdminRoutes = ({ adminToken }) => {
  return adminToken ? <Outlet /> : <Navigate to="/admin/login" />;
};

export default AdminRoutes;
