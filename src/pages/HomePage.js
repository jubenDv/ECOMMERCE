import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import '../css/homepage.css';

const HomePage = () => {
  const [category, setCategory] = useState([]);
  const [products, setProducts] = useState([]);
  const navigate = useNavigate();
  const [carouselImages, setCarouselImages] = useState([]);

  useEffect(() => {
    fetch('http://localhost:5000/api/carousel')
      .then((res) => res.json())
      .then((data) => setCarouselImages(data))
      .catch((err) => console.error(err));
  }, []);

  useEffect(() => {
    fetch('http://localhost:5000/api/category')
      .then((res) => res.json())
      .then((data) => setCategory(data))
      .catch((err) => console.error(err));

    fetch('http://localhost:5000/api/products')
      .then((res) => res.json())
      .then((data) => setProducts(shuffleArray(data)))
      .catch((err) => console.error(err));
  }, []);

  const shuffleArray = (array) => {
    return array
      .map((item) => ({ ...item, sort: Math.random() }))
      .sort((a, b) => a.sort - b.sort)
      .map(({ sort, ...rest }) => rest);
  };

  const [currentIndex, setCurrentIndex] = useState(0);
  const handleDotClick = (index) => setCurrentIndex(index);

  // ** CATEGORY SCROLL LOGIC **
  const categoryRef = useRef(null);
  const scrollAmount = 210; // Pixels per scroll

  const scrollLeft = () => {
    if (categoryRef.current) {
      categoryRef.current.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (categoryRef.current) {
      categoryRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <>
      {/* === CAROUSEL === */}
      <div className="homepage-carousel-container">
        {carouselImages.length > 0 ? (
          <>
            <div className="homepage-carousel">
              {carouselImages.map((image, index) => (
                <img
                  key={image.id}
                  src={`http://localhost:5000${image.image_path}`}
                  alt="Carousel"
                  className={`homepage-carousel-image ${index === currentIndex ? "active" : "hidden"}`}
                />
              ))}
            </div>
  
            <div className="homepage-carousel-dots">
              {carouselImages.map((_, index) => (
                <span
                  key={index}
                  className={`homepage-carousel-dot ${index === currentIndex ? "active" : ""}`}
                  onClick={() => handleDotClick(index)}
                ></span>
              ))}
            </div>
          </>
        ) : (
          <p>No images available</p>
        )}
      </div>
  
      {/* === CATEGORY LIST WITH SIDE SCROLL BUTTONS === */}
      <div className="homepage-container">
        <div className="homepage-content">
          <div className="homepage-brand-section">
            <button className="scroll-btn left" onClick={scrollLeft}>‹</button>
            
            <div className="homepage-brand-cards" ref={categoryRef}>
              {category.map((category) => (
                <div
                  key={category.id}
                  className="homepage-brand-card"
                  onClick={() => navigate(`/category/${category.id}`)}
                >
                  <img
                    src={category.image_path ? category.image_path : "/default-category.png"}
                    alt={category.name}
                    className="homepage-brand-image"
                  />
                  <h3>{category.name}</h3>
                </div>
              ))}
            </div>
  
            <button className="scroll-btn right" onClick={scrollRight}>›</button>
          </div>
        </div>
      </div>
  
      {/* === FULL-WIDTH DISCOVER SECTION === */}
      <div className="homepage-discover">
        <div className='homepage-discover-container'>
        <h2 className="homepage-title">Daily Discover</h2>
        <div className="homepage-product-cards">
          {products.map((product) => (
            <div
              key={product.id}
              className="homepage-product-card"
              onClick={() => navigate(`/product/${product.id}`)}
            >
              <img src={product.image} alt={product.name} className="homepage-product-image" />
              <h3>{product.name}</h3>
              <p>₱{product.price}</p>
            </div>
          ))}
        </div>
        </div>
      </div>
    </>
  );  
};

export default HomePage;
