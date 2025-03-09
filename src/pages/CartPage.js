import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../css/cartpage.css';

const CartPage = () => {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [productStocks, setProductStocks] = useState({}); // Store latest product stock information
  const [selectedItems, setSelectedItems] = useState([]); // Store selected items for checkout
  const [checkoutError, setCheckoutError] = useState(''); // Error message for checkout
  const navigate = useNavigate();

  // Fetch the latest stock information for each product in the cart
  const fetchProductStocks = useCallback(async (cartItems) => {
    try {
      const stocks = {};
      for (const item of cartItems) {
        const response = await fetch(`http://localhost:5000/api/products/details/${item.product_id}`);
        if (!response.ok) throw new Error('Failed to fetch product stock.');
        const data = await response.json();
        stocks[item.product_id] = data.stock; // Store stock information
      }
      setProductStocks(stocks);
    } catch (err) {
      console.error('Error fetching product stocks:', err);
    }
  }, []);

  // Fetch cart items and their latest stock information
  const fetchCartItems = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await fetch('http://localhost:5000/api/cart', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Failed to fetch.');

      const data = await response.json();

      // Combine similar products into a single entry with summed quantities
      const combinedItems = data.reduce((acc, item) => {
        const existingItem = acc.find((i) => i.product_id === item.product_id);
        if (existingItem) {
          existingItem.quantity += item.quantity; // Sum quantities
        } else {
          acc.push({ ...item }); // Add new item
        }
        return acc;
      }, []);

      setCartItems(combinedItems);
      await fetchProductStocks(combinedItems); // Fetch stock information for the updated cart items
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [navigate, fetchProductStocks]);

  useEffect(() => {
    fetchCartItems();

    // Listen for cart updates
    const handleCartUpdate = () => {
      fetchCartItems();
    };

    window.addEventListener('cartUpdated', handleCartUpdate);

    return () => {
      window.removeEventListener('cartUpdated', handleCartUpdate);
    };
  }, [fetchCartItems]);

  // Remove item from cart
  const handleRemoveItem = async (product_id) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await fetch(`http://localhost:5000/api/cart/${product_id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to remove.');

      // Update cart items after removal
      setCartItems((items) => items.filter((item) => item.product_id !== product_id));

      // Notify cart update
      setTimeout(() => {
        window.dispatchEvent(new Event('cartUpdated'));
      }, 0);
    } catch (err) {
      alert(err.message);
    }
  };

  // Reduce quantity of an item in the cart
  const handleReduceQuantity = async (product_id) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await fetch(`http://localhost:5000/api/cart/reduce/${product_id}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to reduce quantity.');

      // Update cart items after reducing quantity
      setCartItems((items) =>
        items.map((item) =>
          item.product_id === product_id
            ? { ...item, quantity: item.quantity - 1 }
            : item
        )
      );

      // Notify cart update
      setTimeout(() => {
        window.dispatchEvent(new Event('cartUpdated'));
      }, 0);
    } catch (err) {
      alert(err.message);
    }
  };

  // Increase quantity of an item in the cart
  const handleIncreaseQuantity = async (product_id) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await fetch(`http://localhost:5000/api/cart/increase/${product_id}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to increase quantity.');

      // Update cart items after increasing quantity
      setCartItems((items) =>
        items.map((item) =>
          item.product_id === product_id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );

      // Notify cart update
      setTimeout(() => {
        window.dispatchEvent(new Event('cartUpdated'));
      }, 0);
    } catch (err) {
      alert(err.message);
    }
  };

  // Handle checkbox selection
  const handleCheckboxChange = (product_id) => {
    setSelectedItems((prevSelected) =>
      prevSelected.includes(product_id)
        ? prevSelected.filter((id) => id !== product_id)
        : [...prevSelected, product_id]
    );
  };

  // Handle checkout for selected items
  const handleCheckout = () => {
    setCheckoutError(''); // Reset checkout error

    const selectedCartItems = cartItems.filter((item) => selectedItems.includes(item.product_id));

    // Check if any selected item exceeds the available stock
    const invalidItems = selectedCartItems.filter(
      (item) => item.quantity > (productStocks[item.product_id] || 0)
    );

    if (invalidItems.length > 0) {
      setCheckoutError(
        `The following items exceed available stock: ${invalidItems
          .map((item) => item.name)
          .join(', ')}. Please adjust quantities before proceeding.`
      );
      return;
    }

    // If all selected items are valid, proceed to checkout
    navigate('/checkout', { state: { selectedItems: selectedCartItems } });
  };

  if (loading) return <p className="cart-loading">Loading...</p>;
  if (error) return <p className="cart-error">{`Error: ${error}`}</p>;

  return (
    <div className="cart-page-container">
      <h2 className="cart-title">Your Cart</h2>
      {cartItems.length === 0 ? (
        <p className="cart-empty-message">Cart is empty.</p>
      ) : (
        <>
          <ul className="cart-items-list">
            {cartItems.map(({ product_id, name, price, quantity }) => {
              const totalPrice = parseFloat(price || 0) * quantity;
              const availableStock = productStocks[product_id] || 0;
              let stockMessage = '';
              if (availableStock === 0) {
                stockMessage = 'Out of stock, wait for restock';
              } else if (quantity > availableStock) {
                stockMessage = `Quantity exceeds available stock: ${availableStock}`;
              } else {
                stockMessage = `Available: ${availableStock}`;
              }

              return (
                <li key={product_id} className="cart-item">
                  <input
                    type="checkbox"
                    className="cart-item-checkbox"
                    checked={selectedItems.includes(product_id)}
                    onChange={() => handleCheckboxChange(product_id)}
                  />
                  <Link to={`/product/${product_id}`} className="cart-item-link">
                    {name}
                  </Link>
                  ₱{totalPrice.toFixed(2)} (Quantity: {quantity})
                  <p className="cart-stock-message">{stockMessage}</p>
                  <button
                    className="cart-reduce-button"
                    onClick={() => handleReduceQuantity(product_id)}
                    disabled={quantity <= 1} // Disable if quantity is 1 or less
                  >
                    Reduce
                  </button>
                  <button
                    className="cart-increase-button"
                    onClick={() => handleIncreaseQuantity(product_id)}
                    disabled={quantity >= availableStock} // Disable if quantity is equal to or exceeds available stock
                  >
                    Increase
                  </button>
                  <button className="cart-remove-button" onClick={() => handleRemoveItem(product_id)}>
                    Remove
                  </button>
                </li>
              );
            })}
          </ul>
          <h3 className="cart-total">
            Total: ₱
            {cartItems
              .reduce((acc, { price, quantity }) => acc + parseFloat(price || 0) * quantity, 0)
              .toFixed(2)}
          </h3>
          {checkoutError && <p className="cart-checkout-error">{checkoutError}</p>}
          <button
            className="cart-checkout-button"
            onClick={handleCheckout}
            disabled={selectedItems.length === 0}
          >
            Checkout Selected Items
          </button>
        </>
      )}
    </div>
  );
};

export default CartPage;