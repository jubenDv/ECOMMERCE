import React, { useEffect, useState, useCallback } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';

const AdminCategoryPage = () => {
  const { categoryId } = useParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Check if admin is authenticated
  const checkToken = useCallback(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/admin/login');
      return false;
    }
    return true;
  }, [navigate]);

  // Fetch products for the category
  useEffect(() => {
    if (!checkToken()) return;

    setLoading(true);
    fetch(`http://localhost:5000/api/category/${categoryId}/products`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` },
    })
      .then((res) => res.json())
      .then((data) => setProducts(data))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, [categoryId, checkToken]);

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h2>Category Products</h2>
      <button>
        <Link to={`/admin/category/${categoryId}/add-product`}>Add Product</Link>
      </button>
      <ul style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
        {products.length > 0 ? (
          products.map((product) => (
            <li key={product.id} style={{ listStyle: 'none', textAlign: 'center' }}>
              <Link to={`/admin/products/${product.id}`} style={{ textDecoration: 'none', color: 'black' }}>
                <div>
                  {product.image ? (
                    <img
                      src={product.image}
                      alt={product.name}
                      style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '8px' }}
                    />
                  ) : (
                    <div style={{
                      width: '100px', height: '100px', display: 'flex', alignItems: 'center',
                      justifyContent: 'center', background: '#ddd', borderRadius: '8px'
                    }}>
                      No Image
                    </div>
                  )}
                  <p>{product.name}</p>
                </div>
              </Link>
            </li>
          ))
        ) : (
          <p>No products found for this category.</p>
        )}
      </ul>
    </div>
  );
};

export default AdminCategoryPage;