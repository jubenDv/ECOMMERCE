import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import '../css/productPage.css'; // Ensure you create a matching CSS file

const ProductPage = () => {
  const { productId } = useParams();
  const [product, setProduct] = useState(null);
  const [selectedModel, setSelectedModel] = useState('');
  const [quantity, setQuantity] = useState(1); // Default to 1
  const [currentImageIndex, setCurrentImageIndex] = useState(0); // State for managing the current main image
  const [cartQuantity, setCartQuantity] = useState(0); // Track the quantity of this product already in the cart
  const navigate = useNavigate();

  useEffect(() => {
    fetch(`http://localhost:5000/api/products/details/${productId}`)
      .then((res) => res.json())
      .then((data) => {
        // Fetch category name and brand name separately
        return Promise.all([
          fetch(`http://localhost:5000/api/category/${data.category_id}`).then(res => res.json()),
          data.brand_id ? fetch(`http://localhost:5000/api/brand/${data.brand_id}`).then(res => res.json()) : Promise.resolve({ name: 'Unspecified' }) // Handle null brand_id
        ])
        .then(([categoryData, brandData]) => {
          // Update product state with the fetched category name and brand name
          const fullImageUrls = data.images.map(image => `http://localhost:5000/uploads/${image.split('/').pop()}`);
          setProduct({
            ...data,
            images: fullImageUrls,
            category_name: categoryData.category_name,
            brand_name: brandData.name // Add the brand name
          });
          setSelectedModel(data.models?.[0] || ''); // Default to first model if available
        });
      })
      .catch((err) => console.error('Error fetching product details, category or brand:', err));
  }, [productId]);

  // Fetch the current quantity of this product in the user's cart
  useEffect(() => {
    const fetchCartQuantity = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;

      try {
        const response = await fetch('http://localhost:5000/api/cart', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) throw new Error('Failed to fetch cart.');

        const data = await response.json();
        const cartItem = data.find((item) => item.product_id === parseInt(productId));
        setCartQuantity(cartItem ? cartItem.quantity : 0);
      } catch (err) {
        console.error('Error fetching cart quantity:', err);
      }
    };

    fetchCartQuantity();
  }, [productId]);

  const addToCart = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Please log in to add items to your cart.');
      navigate('/login');
      return;
    }
  
    // Ensure cartQuantity is fetched and up-to-date
    if (cartQuantity === null) {
      alert('Cart quantity is still being fetched. Please try again.');
      return;
    }
  
    // Check if adding the selected quantity would exceed the available stock
    const totalQuantity = cartQuantity + quantity;
    if (totalQuantity > product.stock) {
      alert(`You already have ${cartQuantity} of this item in your cart. Adding ${quantity} more would exceed the available stock.`);
      return;
    }
  
    try {
      const response = await fetch('http://localhost:5000/api/cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          productId: product.id,
          name: product.name,
          price: product.price,
          image: product.image,
          model: selectedModel,
          quantity,
        }),
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add item to cart.');
      }
  
      const data = await response.json();
      alert('Item added to cart successfully!');
  
      // ✅ Dispatch the cartUpdated event with updated cart count
      window.dispatchEvent(new CustomEvent('cartUpdated', { detail: data.cartCount }));
  
      // Update the cartQuantity state after adding to cart
      setCartQuantity(totalQuantity);
  
    } catch (err) {
      console.error('Error adding item to cart:', err);
      alert(err.message);
    }
  };

  const handleThumbnailClick = (index) => {
    setCurrentImageIndex(index); // Change the main image when a thumbnail is clicked
  };

  const handleNextImage = () => {
    setCurrentImageIndex((prevIndex) => (prevIndex + 1) % product.images.length); // Slide to the next image
  };

  const handlePrevImage = () => {
    setCurrentImageIndex((prevIndex) => (prevIndex - 1 + product.images.length) % product.images.length); // Slide to the previous image
  };

  if (!product) {
    return <p>Loading product details...</p>;
  }

  return (
    <>
      <div className="product-container">
        {/* Left Section - Product Images */}
        <div className="product-image-section">
          <div className="carousel-container">
            <button className="carousel-btn left" onClick={handlePrevImage}>‹</button>
            <img className="product-main-image" src={product.images[currentImageIndex]} alt={product.name} />
            <button className="carousel-btn right" onClick={handleNextImage}>›</button>
          </div>

          <div className="product-thumbnails">
            {product.images?.map((img, index) => (
              <img
                key={index}
                src={img}  // Full URL
                alt="Thumbnail"
                className="thumbnail"
                onClick={() => handleThumbnailClick(index)} // Change the main image when thumbnail is clicked
              />
            ))}
          </div>
        </div>

        {/* Right Section - Product Details */}
        <div className="product-info-section">
          <h1 className="product-title">{product.name}</h1>
          <div className="product-rating">
            ⭐ N/A | N/A Sold {/* Static example rating */}
          </div>
          <div className="product-price">
            <span className="price">₱{parseFloat(product.price).toLocaleString()}</span>
          </div>
          <div className="product-shipping">
            <p><strong>Shipping to:</strong> N/A</p>
            <p><strong>Shipping Fee:</strong> N/A</p>
          </div>

          {/* Model Selection */}
          {product.models && product.models.length > 0 && (
            <div className="product-models">
              <strong>Model:</strong>
              <div className="model-options">
                {product.models.map((model, index) => (
                  <button
                    key={index}
                    className={selectedModel === model ? 'selected' : ''}
                    onClick={() => setSelectedModel(model)}
                  >
                    {model}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity Selector */}
          <div className="product-quantity">
            <label>Quantity:</label>
            <div className="quantity-selector">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))} // Ensure quantity doesn't go below 1
                className="quantity-btn"
                disabled={quantity <= 1 || product.stock <= 0} // Disable if quantity is 1 or stock is 0
              >
                -
              </button>
              <input
                type="number"
                value={quantity}
                min="1" // Minimum quantity is 1
                max={product.stock}
                readOnly
                className="quantity-input"
              />
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="quantity-btn"
                disabled={quantity >= product.stock || product.stock <= 0} // Disable if quantity reaches stock or stock is 0
              >
                +
              </button>
            </div>
            <span>{product.stock || 'Out of stock'} available</span>
          </div>

          {/* Action Buttons */}
          <div className="product-actions">
            <button 
              className="add-to-cart-btn" 
              onClick={addToCart}
              disabled={product.stock <= 0} // Disable if stock is 0
            >
              {product.stock <= 0 ? 'Out of Stock' : 'Add to Cart'}
            </button>
            <button 
              className="buy-now-btn"
              disabled={product.stock <= 0} // Disable if stock is 0
            >
              Buy Now
            </button>
          </div>
        </div>
      </div>

      {/* Description Section */}
      <div className="product-description">
        <h2 className="product-head">Product Specifications</h2>
        <p className="product-info"><strong>Brand:</strong> {product.brand_name || "N/A"}</p>
        <p className="product-info"><strong>Category:</strong> {product.category_name || "N/A"}</p>
        <p 
          className="product-info"
          style={{ whiteSpace: "pre-wrap" }} // Preserves spaces and newlines
          dangerouslySetInnerHTML={{
            __html: (product.description || "No description available.")
              .replace(/</g, "&lt;") // Prevents HTML injection
              .replace(/>/g, "&gt;")
              .replace(/&lt;(.*?)&gt;/g, "<strong>$1</strong>") // Converts < > into <strong>
          }}
        />
      </div>
    </>
  );
};

export default ProductPage;