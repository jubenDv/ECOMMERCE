import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import '../css/productbrand.css';

const ProductBrand = () => {
  const { brandId } = useParams(); // Get brand ID from URL
  const [products, setProducts] = useState([]);

  useEffect(() => {
    // Fetch products for the brand
    fetch(`http://localhost:5000/api/products/brand/${brandId}`)
      .then((res) => res.json())
      .then(setProducts)
      .catch(console.error); // Minimal error logging
  }, [brandId]);

  return (
    <div className="product-brand-container">
      <h1 className="product-brand-title">Products Under This Brand</h1>

      {products.length > 0 ? (
        <div className="product-card-list">
          {products.map(({ id, name, image, price }) => (
            <Link key={id} to={`/product/${id}`} className="product-card">
              <img src={image || 'default_image.png'} alt={name} className="product-card-image" />
              <div className="product-card-content">
                <h3 className="product-card-name">{name}</h3>
                <p className="product-card-price">₱{price}</p>
                <button className="product-card-button">View Details</button>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <p>No products found for this brand.</p> // Message when no products are available
      )}
    </div>
  );
};

export default ProductBrand;
