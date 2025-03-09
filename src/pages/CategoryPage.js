import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import '../css/brandpage.css';

const CategoryPage = () => {
  const { categoryId } = useParams(); // Get category ID from URL
  const [categoryName, setCategoryName] = useState(''); // Category name
  const [products, setProducts] = useState([]); // Store products
  const [brands, setBrands] = useState([]); // Available brands for filter
  const [selectedBrand, setSelectedBrand] = useState(''); // Selected brand filter
  const [sortOrder, setSortOrder] = useState('low-to-high'); // Price sort order

  useEffect(() => {
    // Fetch category name
    const fetchCategory = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/category/${categoryId}`);
        const data = await response.json();
        setCategoryName(data.category_name);
      } catch (err) {
        console.error('Error fetching category:', err);
      }
    };

    // Fetch products based on category and selected brand
    const fetchProducts = async () => {
      const url = selectedBrand
        ? `http://localhost:5000/api/products/${categoryId}?brandId=${selectedBrand}`
        : `http://localhost:5000/api/products/${categoryId}`;
      try {
        const response = await fetch(url);
        const data = await response.json();
        setProducts(data.map((product) => ({
          ...product,
          image: product.images?.[0] || '/default-product.png', // Default image if none exists
        })));
      } catch (err) {
        console.error('Error fetching products:', err);
      }
    };

    // Fetch brands for filtering
    const fetchBrands = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/brands');
        const data = await response.json();
        setBrands(data);
      } catch (err) {
        console.error('Error fetching brands:', err);
      }
    };

    fetchCategory();
    fetchProducts();
    fetchBrands();
  }, [categoryId, selectedBrand]); // Re-run if categoryId or selectedBrand changes

  // Handle sort order change
  const handleSortChange = (event) => setSortOrder(event.target.value);

  // Handle brand filter change
  const handleBrandChange = (event) => setSelectedBrand(event.target.value);

  // Filter and sort products based on selected brand and sort order
  const filteredProducts = products
    .filter((product) => !selectedBrand || product.brand_id === Number(selectedBrand))
    .sort((a, b) => (sortOrder === 'low-to-high' ? a.price - b.price : b.price - a.price));

  return (
    <div className="brandpage-container">
      <h2 className="brandpage-title">
        <span className="brandpage-name">{categoryName}</span>
      </h2>

      <div className="brandpage-layout">
        <div className="brandpage-sidebar">
          {/* Brand filter dropdown */}
          <h3>Filter by Brand</h3>
          <select onChange={handleBrandChange} value={selectedBrand}>
            <option value="">All Brands</option>
            {brands.length > 0 ? (
              brands.map((brand) => (
                <option key={brand.id} value={brand.id}>{brand.name}</option>
              ))
            ) : (
              <option>No Brands Available</option>
            )}
          </select>

          {/* Sort by price dropdown */}
          <h3>Sort by Price</h3>
          <select onChange={handleSortChange} value={sortOrder}>
            <option value="low-to-high">Low to High</option>
            <option value="high-to-low">High to Low</option>
          </select>
        </div>

        <div className="brandpage-products-list">
          {/* Display filtered and sorted products */}
          {filteredProducts.length > 0 ? (
            filteredProducts.map((product) => (
              <Link key={product.id} to={`/product/${product.id}`} className="brandpage-product-card">
                <img src={product.image} alt={product.name} className="brandpage-product-image" />
                <h3>{product.name}</h3>
                <p>Price: ${parseFloat(product.price).toFixed(2)}</p>
              </Link>
            ))
          ) : (
            <p>No products found.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default CategoryPage;
