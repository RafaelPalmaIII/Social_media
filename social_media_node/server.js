const express = require('express');
const mysql = require('mysql');
const app = express();
const bodyParser = require('body-parser');
const port = 3000;

// MySQL connection setup (ensure these match your phpMyAdmin credentials)
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',        // Replace with your MySQL username
  password: '',        // Replace with your MySQL password
  database: 'social_media'  // Replace with the name of your database
});

// Connect to MySQL
db.connect(function(err) {
  if (err) {
    console.error('Error connecting to the database: ' + err.stack);
    return;
  }
  console.log('Connected to the database as id ' + db.threadId);
});

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Register route (adjusted for MySQL)
app.post('/register', (req, res) => {
  const { username, first_name, middle_name, last_name, suffix, password } = req.body;

  // Simple validation
  if (!username || !first_name || !last_name || !password) {
    return res.status(400).json({ message: 'Username, first name, last name, and password are required.' });
  }

  // Insert user into the database
  const query = 'INSERT INTO users (username, first_name, middle_name, last_name, suffix, password) VALUES (?, ?, ?, ?, ?, ?)';
  db.query(query, [username, first_name, middle_name, last_name, suffix, password], (err, result) => {
    if (err) {
      console.error('Error inserting user into the database: ' + err);
      return res.status(500).json({ message: 'Error registering user.' });
    }
    res.status(201).json({ message: 'User registered successfully!' });
  });
});

// Login route (adjusted for MySQL)
app.post('/login', (req, res) => {
  const { username, password } = req.body;

  // Simple validation
  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required.' });
  }

  // Check if user exists and password matches
  const query = 'SELECT * FROM users WHERE username = ? AND password = ?';
  db.query(query, [username, password], (err, result) => {
    if (err) {
      console.error('Error querying the database: ' + err);
      return res.status(500).json({ message: 'Error logging in.' });
    }

    if (result.length > 0) {
      res.status(200).json({ message: 'Login successful!' });
    } else {
      res.status(401).json({ message: 'Invalid credentials.' });
    }
  });
});

// Serve static files (frontend AngularJS)
app.use(express.static('public'));

// Start server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
