import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import '../css/brandList.css'; // CSS for styling

const BrandPage = () => {
  const [brands, setBrands] = useState([]); // Store brands list

  // Fetch all brands when component mounts
  useEffect(() => {
    fetch('http://localhost:5000/api/brands')
      .then((res) => res.json())
      .then((data) => setBrands(data))
      .catch((err) => console.error('Error fetching brands:', err));
  }, []); // Empty array means only run once

  if (!brands.length) {
    return <p>Loading brands...</p>; // Show loading while fetching
  }

  return (
    <div className="brand-container">
      <h1 className="brand-title">All Brands</h1>
      <div className="brand-list">
        {brands.map((brand) => (
          <div key={brand.id} className="brand-item">
            <Link to={`/brand/${brand.id}`} className="brand-link">
              <img 
                src={brand.image ? brand.image : 'default_image.png'}  // Use default if no image
                alt={brand.name} 
                className="brand-image" 
              />
              <span className="brand-name">{brand.name}</span>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BrandPage;
