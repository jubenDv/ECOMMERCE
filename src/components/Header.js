import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../css/header.css';

const Header = ({ token, setToken }) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState(
    localStorage.getItem('searchQuery') || ''
  );
  const [searchResults, setSearchResults] = useState([]);
  const [cartCount, setCartCount] = useState(0); // Total quantity of items in the cart
  const [categories, setCategories] = useState([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  // Fetch cart count from the backend
  const fetchCartCount = useCallback(() => {
    if (!token) {
      setCartCount(0); // Reset cart count if the user is not logged in
      return;
    }

    fetch('http://localhost:5000/api/cart/count', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        // Set cart count to the total quantity of items in the cart
        setCartCount(data.totalQuantity || 0);
      })
      .catch((err) => console.error('Error fetching cart count:', err));
  }, [token]);

  // Fetch cart count on component mount and when the token changes
  useEffect(() => {
    fetchCartCount(); // Initial cart count fetch
    window.addEventListener('cartUpdated', fetchCartCount); // Update on cart update
    return () => window.removeEventListener('cartUpdated', fetchCartCount);
  }, [fetchCartCount]);

  // Fetch categories on component mount
  useEffect(() => {
    fetch('http://localhost:5000/api/category')
      .then((res) => res.json())
      .then((data) => setCategories(data))
      .catch((err) => console.error('Error fetching categories:', err));
  }, []);

  // Fetch search results when the search query changes
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setSearchResults([]);
      return;
    }
    fetch(`http://localhost:5000/api/search?q=${searchQuery}`)
      .then((res) => res.json())
      .then((data) => setSearchResults(data))
      .catch((err) => console.error('Error fetching search results:', err));
  }, [searchQuery]);

  // Save search query to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('searchQuery', searchQuery);
  }, [searchQuery]);

  // Logout handler to clear cart badge and user token
  const handleLogout = () => {
    setToken(null); // Clear the token
    setCartCount(0); // Reset cart count
    navigate('/login'); // Redirect to login page
  };

  // Handle search form submission
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchResults.length > 0) {
      navigate(`/product/${searchResults[0].id}`);
      setSearchResults([]);
    }
  };

  // Handle search icon click
  const handleSearchIconClick = () => {
    if (searchResults.length > 0) {
      navigate(`/product/${searchResults[0].id}`);
      setSearchResults([]);
    }
  };

  // Handle selecting a product from the search results
  const handleSelectProduct = (product) => {
    setSearchQuery(product.name);
    navigate(`/product/${product.id}`);
    setSearchResults([]);
  };

  // Handle search input focus
  const handleSearchFocus = () => {
    setIsSearchFocused(true);
  };

  // Handle search input blur
  const handleSearchBlur = () => {
    setTimeout(() => setIsSearchFocused(false), 200);
  };

  // Reset the search bar
  const resetSearchBar = () => {
    setSearchQuery('');
    setSearchResults([]);
  };

  return (
    <>
      <header className="header">
        <div className="header-mini">
          <div className="container">
            {token ? (
              <button onClick={handleLogout} className="header-logout">
                Logout
              </button>
            ) : (
              <Link to="/login" className="header-login">
                Login
              </Link>
            )}
          </div>
        </div>

        <div className="header-main">
          <div className="container">
            <Link to="/" className="header-logo" onClick={resetSearchBar}>
              <img
                src="https://media.discordapp.net/attachments/1336945867298705479/1345694908664774679/output-onlinepngtools_1.png?ex=67ca18cc&is=67c8c74c&hm=dc28130ecd3c614aa2e8230daf478167c95f9e471bb75ea76daec1095c30c172&=&format=webp&quality=lossless"
                alt="logo"
              />
            </Link>

            {/* Search Bar */}
            <div className="header-search-container">
              <form className="header-search" onSubmit={handleSearchSubmit}>
                <input
                  type="text"
                  placeholder="Search for products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={handleSearchFocus}
                  onBlur={handleSearchBlur}
                />
                <button
                  type="button"
                  onClick={handleSearchIconClick}
                  disabled={searchResults.length === 0}
                >
                  🔍
                </button>
              </form>

              {/* Dropdown List (Live Search Results) */}
              {isSearchFocused && searchQuery.trim() && (
                <ul className="search-dropdown">
                  {searchResults.length > 0 ? (
                    searchResults.map((product) => (
                      <li key={product.id} onClick={() => handleSelectProduct(product)}>
                        {product.name}
                      </li>
                    ))
                  ) : (
                    <li className="no-results">No products found</li>
                  )}
                </ul>
              )}
            </div>

            {/* Cart Icon */}
            <Link to="/cart" className="header-cart" onClick={resetSearchBar}>
              🛒 {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
            </Link>
          </div>
        </div>
      </header>

      <nav className="header-nav">
        <ul>
          <Link to="/" className="nav-link" onClick={resetSearchBar}>
            HOME
          </Link>

          {/* CATEGORY with Dropdown */}
          <li
            className="header-dropdown"
            onMouseEnter={() => setIsDropdownOpen(true)}
            onMouseLeave={() => setIsDropdownOpen(false)}
          >
            CATEGORY
            <ul className="header-dropdown-menu" style={{ display: isDropdownOpen ? 'flex' : 'none' }}>
              {categories.length > 0 ? (
                categories.map((category) => (
                  <li key={category.id}>
                    <Link to={`/category/${category.id}`} onClick={resetSearchBar}>
                      {category.name}
                    </Link>
                  </li>
                ))
              ) : (
                <li>No Categories Available</li>
              )}
            </ul>
          </li>

          <Link to="/brands" className="nav-link" onClick={resetSearchBar}>
            BRANDS
          </Link>
          <Link to="/about" className="nav-link" onClick={resetSearchBar}>
            ABOUT
          </Link>
        </ul>
      </nav>
    </>
  );
};

export default Header;