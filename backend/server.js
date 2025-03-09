const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Database connection
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

db.connect((err) => {
  if (err) {
    console.error('Database connection error:', err);
  } else {
    console.log('Connected to MySQL database');
  }
});

// Multer setup for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname),
});

const upload = multer({ storage });

// Fetch product details
app.get('/api/products/details/:id', (req, res) => {
  const { id } = req.params;
  let sql = `SELECT p.*, b.name AS brand_name, GROUP_CONCAT(pi.image_path) AS images 
             FROM products p 
             LEFT JOIN product_images pi ON p.id = pi.product_id 
             LEFT JOIN brand b ON p.brand_id = b.id
             WHERE p.id = ? 
             GROUP BY p.id`;

  db.query(sql, [id], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (results.length === 0) return res.status(404).json({ error: 'Product not found' });

    let product = results[0];
    product.images = product.images ? product.images.split(',') : [];
    res.json(product);
  });
});


app.put('/api/products/:id', upload.array('newImages', 20), (req, res) => {
  const { id } = req.params;
  const { name, description, price, stock, existingImages } = req.body; // Added stock field
  let newImagePaths = req.files.map(file => `/uploads/${file.filename}`);

  // Update product details including stock
  let updateProductSQL = 'UPDATE products SET name=?, description=?, price=?, stock=? WHERE id=?';
  db.query(updateProductSQL, [name, description, price, stock, id], (err) => { // Added stock field
    if (err) return res.status(500).json({ error: err.message });

    // Keep existing images, insert new ones
    if (newImagePaths.length > 0) {
      let insertImagesSQL = 'INSERT INTO product_images (product_id, image_path) VALUES ?';
      let values = newImagePaths.map((path) => [id, path]);
      db.query(insertImagesSQL, [values], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Product updated successfully' });
      });
    } else {
      res.json({ message: 'Product updated successfully' });
    }
  });
});

// Delete product
app.delete('/api/products/:id', (req, res) => {
  const { id } = req.params;

  // Step 1: Get image paths before deleting the product
  db.query('SELECT image_path FROM product_images WHERE product_id = ?', [id], (err, results) => {
    if (err) return res.status(500).json({ error: 'Database error retrieving images', details: err.message });

    if (results.length === 0) {
      console.log('No images found for this product.');
    }

    // Step 2: Delete image files from /uploads/
    results.forEach(({ image_path }) => {
      const fullImagePath = path.join(__dirname, 'uploads', path.basename(image_path)); // Ensure correct path

      // Delete image from file system
      fs.access(fullImagePath, fs.constants.F_OK, (err) => {
        if (!err) {
          fs.unlink(fullImagePath, (unlinkErr) => {
            if (unlinkErr) {
              console.error('Error deleting image file:', unlinkErr);
            }
          });
        } else {
          console.warn(`Image file not found: ${fullImagePath}`);
        }
      });
    });

    // Step 3: Delete images from the database
    db.query('DELETE FROM product_images WHERE product_id = ?', [id], (deleteImageErr) => {
      if (deleteImageErr) return res.status(500).json({ error: 'Error deleting images from database', details: deleteImageErr.message });

      // Step 4: Delete the product from the database
      db.query('DELETE FROM products WHERE id = ?', [id], (deleteProductErr) => {
        if (deleteProductErr) return res.status(500).json({ error: 'Error deleting product', details: deleteProductErr.message });

        res.json({ message: 'Product and images deleted successfully' });
      });
    });
  });
});

app.delete('/api/products/:id/delete-image', (req, res) => {
  const { id } = req.params;
  let { imagePath } = req.body; // Get imagePath from request

  if (!imagePath) {
    return res.status(400).json({ error: 'Image path is required' });
  }

  // Ensure imagePath matches database format
  imagePath = imagePath.replace(/^http:\/\/localhost:5000/, ''); // Remove base URL if present
  const fullImagePath = path.join(__dirname, imagePath); // Get absolute path

  // Step 1: Delete from database
  db.query('DELETE FROM product_images WHERE product_id = ? AND image_path = ?', [id, imagePath], (dbErr, result) => {
    if (dbErr) return res.status(500).json({ error: 'Failed to delete image from database', details: dbErr.message });

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Image not found in database' });
    }

    // Step 2: Delete from filesystem
    fs.unlink(fullImagePath, (unlinkErr) => {
      if (unlinkErr && unlinkErr.code !== 'ENOENT') {
        console.error('Error deleting image file:', unlinkErr);
        return res.status(500).json({ error: 'Image deleted from database but file deletion failed' });
      }
      res.json({ message: 'Image deleted successfully' });
    });
  });
});


// JWT secret
const JWT_SECRET = process.env.JWT_SECRET || 'masterjubsspcwise';

// Middleware for authenticating JWT tokens
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Extract Bearer token
  
  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid or expired token.' });
    req.user = user;
    next();
  });
}


// Register API
app.post('/api/register', async (req, res) => {
  const { username, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);

  db.query('INSERT INTO users (username, password) VALUES (?, ?)', [username, hashedPassword], (err) => {
    if (err) return res.status(500).json({ error: 'Registration failed' });
    res.json({ message: 'Registration successful' });
  });
});

// Login API
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;

  db.query('SELECT * FROM users WHERE username = ?', [username], async (err, results) => {
    if (err) return res.status(500).json({ error: 'Login failed' });

    if (results.length === 0 || !(await bcrypt.compare(password, results[0].password))) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const token = jwt.sign({ id: results[0].id, username }, JWT_SECRET);
    res.json({ token });
  });
});

//Admin Login
app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body;

  db.query('SELECT * FROM admins WHERE username = ?', [username], async (err, results) => {
    if (err) return res.status(500).json({ error: 'Login failed' });

    if (results.length === 0) {
      return res.status(401).json({ error: 'Invalid admin credentials' }); //  No admin found
    }

    const isValidPassword = await bcrypt.compare(password, results[0].password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid admin credentials' }); //  Password mismatch
    }

    const token = jwt.sign({ id: results[0].id, username, role: 'admin' }, JWT_SECRET);
    res.json({ token });
  });
});


// ✅ Fetch all categories with correctly formatted image URLs
app.get('/api/category', (req, res) => {
  db.query('SELECT id, name, image_path FROM category', (err, results) => {
    if (err) return res.status(500).json({ error: err.message });

    const updatedResults = results.map(category => {
      let imageUrl = null;

      // Check if image_path exists and properly format the URL
      if (category.image_path) {
        const imagePath = category.image_path.startsWith('/uploads/')
          ? category.image_path.slice('/uploads/'.length)
          : category.image_path;

        imageUrl = `http://localhost:5000/uploads/${imagePath}`;
      }

      return { ...category, image_path: imageUrl };
    });

    res.json(updatedResults);
  });
});

app.post('/api/category', upload.single('image'), (req, res) => {
  const { name } = req.body;
  const imagePath = req.file ? `/uploads/${req.file.filename}` : null; // Store image path
  
  if (!name) return res.status(400).json({ error: 'Category name is required' });

  const query = 'INSERT INTO category (name, image_path) VALUES (?, ?)';
  db.query(query, [name, imagePath], (err, result) => {
    if (err) return res.status(500).json({ error: 'Database error' });

    res.json({ id: result.insertId, name, image_path: imagePath });
  });
});

app.get('/api/products/details/:productId', (req, res) => {
  const { productId } = req.params;

  // Fetch product details, category, and images
  db.query(`
    SELECT p.id, p.name, p.price, p.description, p.category_id, c.name AS category, 
           GROUP_CONCAT(pi.image_path) AS images
    FROM products p
    LEFT JOIN category c ON p.category_id = c.id
    LEFT JOIN product_images pi ON p.id = pi.product_id
    WHERE p.id = ?
    GROUP BY p.id
  `, [productId], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (results.length === 0) return res.status(404).json({ error: 'Product not found' });

    const product = results[0];

    // Split the images back into an array
    const images = product.images ? product.images.split(',').map(image => `/uploads/${image}`) : [];

    res.json({
      id: product.id,
      name: product.name,
      price: product.price,
      description: product.description,
      category: product.category,
      images: images
    });
  });
});


app.get('/api/category/:categoryId', (req, res) => {
  const { categoryId } = req.params;

  // Fetch category details including name and image
  db.query('SELECT id, name, image_path FROM category WHERE id = ?', [categoryId], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });

    if (results.length === 0) return res.status(404).json({ error: 'Category not found' });

    const category = results[0];

    // Construct full image URL if image_path exists
    const imageUrl = category.image_path
      ? `http://localhost:5000/uploads/${category.image_path}`
      : null; // Return null if no image

    // You can either remove brand_name or fetch brand details as needed
    // For now, we'll assume you might want to get the brand details if required:
    db.query('SELECT name FROM brand WHERE id = ?', [category.brand_id], (err, brandResults) => {
      if (err) return res.status(500).json({ error: err.message });

      let brandName = 'Unspecified'; // Default to 'Unspecified' if no brand is found
      if (brandResults.length > 0) {
        brandName = brandResults[0].name;
      }

      res.json({
        category_id: category.id,
        category_name: category.name,
        category_image: imageUrl,
        brand_name: brandName // Add the brand name fetched
      });
    });
  });
});


app.get('/api/search', (req, res) => {
  const { q } = req.query;

  if (!q) {
    return res.json([]); // Return empty array if no query
  }

  const query = `
    SELECT id, name 
    FROM products 
    WHERE name LIKE ? 
    LIMIT 10`; // Limit results

  db.query(query, [`%${q}%`], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });

    res.json(results);
  });
});



app.get('/api/products/:categoryId', (req, res) => {
  const { categoryId } = req.params;
  const { brandId } = req.query; // Get the brandId from query params

  // Modify the query to filter by brand if brandId is provided
  let query = `
    SELECT p.id, p.name, p.price, p.category_id, p.brand_id, 
           c.name AS category
    FROM products p
    LEFT JOIN category c ON p.category_id = c.id
    WHERE p.category_id = ?
  `;
  let queryParams = [categoryId];

  // Add brand filter if brandId is provided
  if (brandId) {
    query += ' AND p.brand_id = ?';
    queryParams.push(brandId);
  }

  // Fetch filtered products
  db.query(query, queryParams, (err, productResults) => {
    if (err) return res.status(500).json({ error: err.message });
    if (productResults.length === 0) return res.json([]); // Return empty array if no products found

    let products = productResults;
    let count = 0; // Track processed products

    // Fetch images and brand names for each product
    products.forEach((product, index) => {
      // Fetch product images
      db.query('SELECT image_path FROM product_images WHERE product_id = ?', [product.id], (err, imageResults) => {
        if (err) return res.status(500).json({ error: err.message });

        // Map image paths properly
        const images = imageResults.map(img => `http://localhost:5000/uploads/${img.image_path.replace('/uploads/', '')}`);

        // Fetch brand name
        db.query('SELECT name FROM brand WHERE id = ?', [product.brand_id], (err, brandResults) => {
          if (err) return res.status(500).json({ error: err.message });

          const brandName = brandResults.length > 0 ? brandResults[0].name : 'Unspecified'; // Default to 'Unspecified' if no brand

          // Attach images and brand name to product
          products[index] = {
            ...product,
            images: images.length > 0 ? images : null, // Set null if no images
            brand: brandName
          };

          count++; // Increment count after processing
          if (count === products.length) {
            res.json(products); // Send response after all queries are done
          }
        });
      });
    });
  });
});

// Fetch all carousel images
app.get('/api/carousel', (req, res) => {
  db.query('SELECT * FROM carousel_images ORDER BY created_at DESC', (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});



// Add a new carousel image
app.post('/api/carousel', upload.single('image'), (req, res) => {
  const imagePath = `/uploads/${req.file.filename}`;
  db.query('INSERT INTO carousel_images (image_path) VALUES (?)', [imagePath], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: result.insertId, image_path: imagePath });
  });
});

// ✅ Get all products by category (with sorting & filtering)
app.get('/:categoryId', (req, res) => {
  const { categoryId } = req.params;
  const { sort, brand } = req.query;

  let query = 'SELECT * FROM products WHERE category_id = ?';
  const queryParams = [categoryId];

  // Filter by brand if provided
  if (brand) {
    query += ' AND brand_name = ?';
    queryParams.push(brand);
  }

  // Sort by price (low-to-high or high-to-low)
  if (sort === 'low-to-high') {
    query += ' ORDER BY price ASC';
  } else if (sort === 'high-to-low') {
    query += ' ORDER BY price DESC';
  }

  db.query(query, queryParams, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });

    res.json(results);
  });
});

// ✅ Get a single category by ID
app.get('/category/:id', (req, res) => {
  const { id } = req.params;

  db.query('SELECT * FROM categories WHERE id = ?', [id], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });

    if (results.length === 0) {
      return res.status(404).json({ message: 'Category not found' });
    }

    res.json(results[0]); // Return the category details
  });
});

// Delete a carousel image
app.delete('/api/carousel/:id', (req, res) => {
  const { id } = req.params;
  db.query('DELETE FROM carousel_images WHERE id = ?', [id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Image deleted successfully' });
  });
});


// Get all cart items
app.get('/api/cart', authenticateToken, (req, res) => {
  const userId = req.user?.id;

  if (!userId) {
    return res.status(403).json({ error: 'Unauthorized access, invalid user ID' });
  }

  const query = 'SELECT * FROM cart WHERE user_id = ?';
  db.query(query, [userId], (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Database query failed' });
    }

    res.json(Array.isArray(results) ? results : []);
  });
});

// Get cart item count and total quantity
app.get('/api/cart/count', authenticateToken, (req, res) => {
  const userId = req.user?.id;

  if (!userId) {
    return res.status(403).json({ error: 'Unauthorized access, invalid user ID' });
  }

  // Query to get the total number of unique items and total quantity in the cart
  const query = `
    SELECT 
      COUNT(*) AS totalItems, 
      SUM(quantity) AS totalQuantity 
    FROM cart 
    WHERE user_id = ?;
  `;

  db.query(query, [userId], (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Database query failed' });
    }

    // Extract results (default to 0 if null)
    const totalItems = results[0]?.totalItems || 0; // Total number of unique items in the cart
    const totalQuantity = results[0]?.totalQuantity || 0; // Total quantity of all items in the cart

    res.json({ totalItems, totalQuantity });
  });
});

// Reduce quantity of a product in the cart
app.put('/api/cart/reduce/:product_id', authenticateToken, (req, res) => {
  const { product_id } = req.params;
  const userId = req.user.id;

  const query = `
    UPDATE cart 
    SET quantity = quantity - 1 
    WHERE user_id = ? AND product_id = ? AND quantity > 1;
  `;

  db.query(query, [userId, product_id], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });

    if (results.affectedRows === 0) {
      return res.status(400).json({ error: 'Cannot reduce quantity below 1.' });
    }

    res.json({ message: 'Quantity reduced successfully.' });
  });
});

// Increase quantity of a product in the cart
app.put('/api/cart/increase/:product_id', authenticateToken, (req, res) => {
  const { product_id } = req.params;
  const userId = req.user.id;

  // First, fetch the current quantity in the cart and the available stock for the product
  const fetchQuery = `
    SELECT c.quantity, p.stock 
    FROM cart c
    JOIN products p ON c.product_id = p.id
    WHERE c.user_id = ? AND c.product_id = ?;
  `;

  db.query(fetchQuery, [userId, product_id], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });

    if (results.length === 0) {
      return res.status(404).json({ error: 'Product not found in cart.' });
    }

    const { quantity: currentQuantity, stock: availableStock } = results[0];

    // Check if increasing the quantity would exceed the available stock
    if (currentQuantity >= availableStock) {
      return res.status(400).json({ error: 'Cannot increase quantity beyond available stock.' });
    }

    // If valid, update the quantity in the cart
    const updateQuery = `
      UPDATE cart 
      SET quantity = quantity + 1 
      WHERE user_id = ? AND product_id = ?;
    `;

    db.query(updateQuery, [userId, product_id], (err, results) => {
      if (err) return res.status(500).json({ error: err.message });

      if (results.affectedRows === 0) {
        return res.status(400).json({ error: 'Failed to increase quantity.' });
      }

      res.json({ message: 'Quantity increased successfully.' });
    });
  });
});



// ✅ Insert or Update Cart Item
app.post('/api/cart', authenticateToken, (req, res) => {
  const { productId, name, price, quantity = 1 } = req.body;
  const userId = req.user.id;

  // Validate quantity
  if (typeof quantity !== 'number' || quantity < 1) {
    return res.status(400).json({ error: 'Quantity must be a number greater than or equal to 1.' });
  }

  // Check if the product already exists in the cart
  const checkQuery = 'SELECT * FROM cart WHERE user_id = ? AND product_id = ?';
  db.query(checkQuery, [userId, productId], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });

    if (results.length > 0) {
      // Product already exists in the cart, update the quantity
      const existingQuantity = results[0].quantity;
      const newQuantity = existingQuantity + quantity;

      const updateQuery = 'UPDATE cart SET quantity = ? WHERE user_id = ? AND product_id = ?';
      db.query(updateQuery, [newQuantity, userId, productId], (err, updateResults) => {
        if (err) return res.status(500).json({ error: err.message });

        // Fetch updated cart count
        db.query('SELECT SUM(quantity) AS totalItems FROM cart WHERE user_id = ?', [userId], (err, countResults) => {
          if (err) return res.status(500).json({ error: err.message });

          res.json({ 
            message: 'Item quantity updated in cart successfully', 
            cartCount: countResults[0].totalItems || 0 // ✅ Return updated count 
          });
        });
      });
    } else {
      // Product does not exist in the cart, insert a new item
      const insertQuery = `
        INSERT INTO cart (user_id, product_id, name, price, quantity) 
        VALUES (?, ?, ?, ?, ?);
      `;

      db.query(insertQuery, [userId, productId, name, price, quantity], (err, insertResults) => {
        if (err) return res.status(500).json({ error: err.message });

        // Fetch updated cart count
        db.query('SELECT SUM(quantity) AS totalItems FROM cart WHERE user_id = ?', [userId], (err, countResults) => {
          if (err) return res.status(500).json({ error: err.message });

          res.json({ 
            message: 'Item added to cart successfully', 
            cartCount: countResults[0].totalItems || 0 // ✅ Return updated count 
          });
        });
      });
    }
  });
});

// Delete Cart Item and Return Updated Cart Count
app.delete('/api/cart/:id', authenticateToken, (req, res) => {
  const { id } = req.params;  // This is the product_id
  const userId = req.user.id;

  console.log('Attempting to delete item with product_id:', id, 'for user with id:', userId);

  // Ensure we're deleting based on product_id
  const deleteQuery = 'DELETE FROM cart WHERE product_id = ? AND user_id = ?';
  db.query(deleteQuery, [id, userId], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });

    if (results.affectedRows === 0) {
      return res.status(404).json({ message: 'Cart item not found or unauthorized access' });
    }

    // Fetch updated cart count after deletion
    const countQuery = 'SELECT SUM(quantity) AS totalItems FROM cart WHERE user_id = ?';
    db.query(countQuery, [userId], (err, countResults) => {
      if (err) return res.status(500).json({ error: err.message });

      const updatedCartCount = countResults[0]?.totalItems || 0;

      // Return updated cart count to frontend
      res.json({
        message: 'Item removed from cart successfully',
        updatedCartCount,
      });
    });
  });
});




// ✅ Add a new category with image
app.post('/api/category', upload.single('image'), (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Category name is required' });

  const imagePath = req.file ? `/uploads/${req.file.filename}` : null; // Save image path if uploaded

  db.query(
    'INSERT INTO category (name, image_path) VALUES (?, ?)',
    [name, imagePath],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });

      res.json({ id: result.insertId, name, image_path: imagePath });
    }
  );
});

// ✅ Add a new brand with image
app.post('/api/brand', upload.single('image'), (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Brand name is required' });

  const imagePath = req.file ? `/uploads/${req.file.filename}` : null; // Save image path if uploaded

  db.query(
    'INSERT INTO brand (name, image_path) VALUES (?, ?)',
    [name, imagePath],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });

      res.json({ id: result.insertId, name, image_path: imagePath });
    }
  );
});

// ✅ Fetch all brands
app.get('/api/brand', (req, res) => {
  db.query('SELECT * FROM brand', (err, results) => {
    if (err) return res.status(500).json({ error: err.message });

    res.json(results);
  });
});

app.get('/api/brand/:brandId', (req, res) => {
  const { brandId } = req.params;

  // Ensure the brandId is a valid number
  if (isNaN(brandId)) {
    return res.status(400).json({ error: 'Invalid brand ID' });
  }

  // SQL query to fetch the brand by its ID
  const query = 'SELECT * FROM brand WHERE id = ?';

  db.query(query, [brandId], (err, results) => {
    if (err) {
      console.error('Error fetching brand:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: 'Brand not found' });
    }

    // Send back the brand details
    res.json(results[0]);
  });
});

// ✅ Update a brand (edit name and/or image)
app.put('/api/brand/:id/edit', upload.single('image'), (req, res) => {
  const { id } = req.params;
  const { name } = req.body;

  if (!name) return res.status(400).json({ error: 'Brand name is required' });

  const imagePath = req.file ? `/uploads/${req.file.filename}` : null;

  // If an image is uploaded, update both name and image
  const query = imagePath
    ? 'UPDATE brand SET name = ?, image_path = ? WHERE id = ?'
    : 'UPDATE brand SET name = ? WHERE id = ?';

  const values = imagePath ? [name, imagePath, id] : [name, id];

  db.query(query, values, (err, result) => {
    if (err) return res.status(500).json({ error: err.message });

    res.json({ id, name, image_path: imagePath });
  });
});

app.delete('/api/brand/:id/delete', (req, res) => {
  const { id } = req.params;
  db.query('DELETE FROM brand WHERE id = ?', [id], (err, result) => {
    if (err) {
      return res.status(500).json({ message: 'Error deleting brand' });
    }
    res.status(200).json({ message: 'Brand deleted successfully' });
  });
});



app.put('/api/category/:categoryId/edit', upload.single('image'), (req, res) => {
  const { categoryId } = req.params;
  const { name } = req.body;
  const imagePath = req.file ? `/uploads/${req.file.filename}` : null;

  if (!name) return res.status(400).json({ error: 'Category name is required' });

  db.query('SELECT image_path FROM category WHERE id = ?', [categoryId], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });

    const oldImagePath = results[0]?.image_path;

    db.query('UPDATE category SET name = ?, image_path = COALESCE(?, image_path) WHERE id = ?', 
      [name, imagePath, categoryId], 
      (err) => {
        if (err) return res.status(500).json({ error: err.message });

        if (oldImagePath && imagePath) {
          fs.unlink(path.join(__dirname, oldImagePath), (err) => {
            if (err) console.error('Error deleting old image:', err);
          });
        }

        res.json({ id: categoryId, name, image_path: imagePath });
      }
    );
  });
});

// ✅ Delete a category (only if no products exist & remove image)
app.delete('/api/category/:categoryId/delete', (req, res) => {
  const { categoryId } = req.params;

  // 🔹 Check if the category has products
  db.query('SELECT COUNT(*) AS productCount FROM products WHERE category_id = ?', [categoryId], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });

    if (results[0].productCount > 0) {
      return res.status(400).json({ error: 'Cannot delete category with products' });
    }

    // 🔹 Retrieve category image path before deletion
    db.query('SELECT image_path FROM category WHERE id = ?', [categoryId], (err, results) => {
      if (err) return res.status(500).json({ error: err.message });

      const imagePath = results[0]?.image_path;

      // 🔹 Delete category from database
      db.query('DELETE FROM category WHERE id = ?', [categoryId], (err) => {
        if (err) return res.status(500).json({ error: err.message });

        // 🔹 If the category had an image, delete it from the local folder
        if (imagePath) {
          const fullPath = path.join(__dirname, imagePath);
          fs.unlink(fullPath, (err) => {
            if (err) console.error('Error deleting image:', err);
          });
        }

        res.json({ success: true, message: 'Category deleted successfully' });
      });
    });
  });
});


// ✅ Fetch all products for a specific category, including the first image
app.get('/api/category/:categoryId/products', (req, res) => {
  const { categoryId } = req.params;

  const query = `
    SELECT p.id, p.name, p.description, p.price, 
           pi.image_path
    FROM products p
    LEFT JOIN (
      SELECT product_id, MIN(image_path) AS image_path
      FROM product_images
      GROUP BY product_id
    ) pi ON p.id = pi.product_id
    WHERE p.category_id = ?;
  `;

  db.query(query, [categoryId], (err, results) => {
    if (err) {
      console.error('Error fetching products:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    // Format image URLs properly
    const products = results.map((product) => {
      let imageUrl = null;

      if (product.image_path) {
        const imagePath = product.image_path.startsWith('/uploads/')
          ? product.image_path.slice('/uploads/'.length)
          : product.image_path;

        imageUrl = `http://localhost:5000/uploads/${imagePath}`;
      }

      return {
        ...product,
        image: imageUrl, // Attach the full image URL
      };
    });

    res.json(products);
  });
});

// ADD PRODUCT
app.post('/api/category/:categoryId/products', (req, res) => {
  let { categoryId } = req.params;
  const { name, description, price, stock } = req.body;

  // Validate required fields
  if (!name || !description || !price || stock === undefined) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  // Convert categoryId to integer
  categoryId = parseInt(categoryId, 10);
  if (isNaN(categoryId)) {
    return res.status(400).json({ error: 'Invalid category ID' });
  }

  // Insert product into the database
  const query = 'INSERT INTO products (name, description, price, stock, category_id, brand_id) VALUES (?, ?, ?, ?, ?, ?)';
  db.query(query, [name, description, price, stock, categoryId, req.body.brandId], (err, result) => {
    if (err) {
      console.error('Error adding product:', err);
      res.status(500).json({ error: 'Database error' });
    } else {
      res.json({ 
        id: result.insertId, 
        name, 
        description, 
        price, 
        stock, 
        category_id: categoryId, 
        brand_id: req.body.brandId 
      });
    }
  });
});


// ✅ Delete a product
app.delete('/api/products/:productId', (req, res) => {
  const { productId } = req.params;

  // Check if the product exists before deleting
  db.query('SELECT * FROM products WHERE id = ?', [productId], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });

    if (results.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Ensure product does not belong to any category before deleting
    db.query('DELETE FROM products WHERE id = ?', [productId], (err, deleteResult) => {
      if (err) return res.status(500).json({ error: err.message });

      res.json({ message: 'Product deleted successfully' });
    });
  });
});

app.put('/api/products/:productId', (req, res) => {
  const { productId } = req.params;
  const { name, description, price, image } = req.body;

  db.query(
    'UPDATE products SET name = ?, description = ?, price = ?, image = ? WHERE id = ?',
    [name, description, price, image, productId],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      if (result.affectedRows === 0) return res.status(404).json({ error: 'Product not found' });
      res.json({ message: 'Product updated successfully' });
    }
  );
});

app.get('/api/products', (req, res) => {
  const query = `
    SELECT p.id, p.name, p.price, pi.image_path
    FROM products p
    LEFT JOIN (
      SELECT product_id, MIN(image_path) AS image_path
      FROM product_images
      GROUP BY product_id
    ) pi ON p.id = pi.product_id;
  `;

  db.query(query, (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    // Construct the full image URL without repeating '/uploads/'
    const products = results.map((product) => {
      let imageUrl = null;

      // Check if image_path is not null or undefined
      if (product.image_path) {
        // Remove the '/uploads/' prefix from image_path if it exists
        const imagePath = product.image_path.startsWith('/uploads/')
          ? product.image_path.slice('/uploads/'.length)
          : product.image_path;

        imageUrl = `http://localhost:5000/uploads/${imagePath}`;
      }

      return {
        ...product,
        image: imageUrl, // Set image URL or null if image_path is null
      };
    });

    res.json(products);
  });
});

app.get('/api/brands', (req, res) => {
  // Fetch all brands from the database
  db.query('SELECT id, name, image_path FROM brand', (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    // Construct the full image URL for each brand
    const brands = results.map((brand) => {
      let imageUrl = null;

      // Check if image_path is not null or undefined
      if (brand.image_path) {
        // Remove the '/uploads/' prefix from image_path if it exists
        const imagePath = brand.image_path.startsWith('/uploads/')
          ? brand.image_path.slice('/uploads/'.length)
          : brand.image_path;

        imageUrl = `http://localhost:5000/uploads/${imagePath}`;
      }

      return {
        id: brand.id,
        name: brand.name,
        image: imageUrl, // Set image URL or null if image_path is null
      };
    });

    res.json(brands); // Return all brands with images
  });
});

app.get('/api/products/brand/:brandId', (req, res) => {
  const { brandId } = req.params;

  const query = `
    SELECT p.id, p.name, p.price, pi.image_path
    FROM products p
    LEFT JOIN (
      SELECT product_id, MIN(image_path) AS image_path
      FROM product_images
      GROUP BY product_id
    ) pi ON p.id = pi.product_id
    WHERE p.brand_id = ?
  `;

  db.query(query, [brandId], (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    // Construct the full image URL without repeating '/uploads/'
    const products = results.map((product) => {
      let imageUrl = null;

      // Check if image_path is not null or undefined
      if (product.image_path) {
        // Remove the '/uploads/' prefix from image_path if it exists
        const imagePath = product.image_path.startsWith('/uploads/')
          ? product.image_path.slice('/uploads/'.length)
          : product.image_path;

        imageUrl = `http://localhost:5000/uploads/${imagePath}`;
      }

      return {
        ...product,
        image: imageUrl, // Set image URL or null if image_path is null
      };
    });

    res.json(products);
  });
});


app.listen(5000, () => {
  console.log('Server running on port 5000');
});
