const express = require('express');
const bcrypt = require('bcrypt');
const bodyParser = require('body-parser');
const session = require('express-session');
const mysql = require('mysql2');
const path = require('path');
const app = express();
const port = 3000;

// Configure the session middleware
app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true
}));

// Set up MySQL connection
const db = mysql.createConnection({
    host: 'localhost', // MySQL host
    user: 'root', // Your MySQL username
    password: '', // Your MySQL password (empty if default)
    database: 'social_media_node' // The database you want to connect to
});

// Connect to MySQL
db.connect((err) => {
    if (err) {
        console.error('Database connection failed: ' + err.stack);
        return;
    }
    console.log('Connected to MySQL database.');
});

// Middleware for body parsing and session handling
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files (AngularJS frontend) except for the ones we want to restrict
app.use(express.static(path.join(__dirname, 'public'), { extensions: ['html'] }));

// Middleware to check if user is logged in before accessing protected pages (like index.html)
const checkLoggedIn = (req, res, next) => {
    if (!req.session.user) {
        return res.redirect('/login');  // Redirect to login if not logged in
    }
    next();
};

// Serve the home page (index.html) only if logged in
app.get('/', checkLoggedIn, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));  // Serve index.html if logged in
});

app.get('/user', (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ message: 'User is not logged in.' });
    }

    // Assuming you're retrieving the user from a database
    const query = 'SELECT first_name, middle_name, last_name, username, suffix FROM users WHERE id = ?';
    db.query(query, [req.session.user.id], (err, results) => {
        if (err) {
            return res.status(500).json({ message: 'Error fetching user data.' });
        }
        if (results.length === 0) {
            return res.status(404).json({ message: 'User not found.' });
        }
        res.json({ user: results[0] });
    });
});

// Register route
app.post('/register', (req, res) => {
    const { username, first_name, middle_name, last_name, suffix, password } = req.body;

    if (!username || !first_name || !last_name || !password) {
        return res.status(400).json({ message: 'Username, first name, last name, and password are required.' });
    }

    const checkQuery = 'SELECT * FROM users WHERE username = ?';
    db.query(checkQuery, [username], (err, results) => {
        if (err) {
            return res.status(500).json({ message: 'Error checking username availability.' });
        }

        if (results.length > 0) {
            return res.status(400).json({ message: 'Username is already taken.' });
        }

        bcrypt.hash(password, 10, (err, hashedPassword) => {
            if (err) {
                return res.status(500).json({ message: 'Error hashing password.' });
            }

            const query = 'INSERT INTO users (username, first_name, middle_name, last_name, suffix, password) VALUES (?, ?, ?, ?, ?, ?)';
            db.query(query, [username, first_name, middle_name || null, last_name, suffix || null, hashedPassword], (err, result) => {
                if (err) {
                    return res.status(500).json({ message: 'Error registering user.' });
                }
                res.status(201).json({ message: 'User registered successfully!' });
            });
        });
    });
});

// Login route
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    const query = 'SELECT * FROM users WHERE username = ?';
    db.query(query, [username], (err, results) => {
        if (err) return res.status(500).json({ message: 'Error logging in.' });
        if (results.length > 0) {
            const user = results[0];
            bcrypt.compare(password, user.password, (err, result) => {
                if (result) {
                    req.session.user = { 
                        id: user.id, 
                        username: user.username, 
                        first_name: user.first_name, 
                        last_name: user.last_name 
                    };
                    return res.status(200).json({ message: 'Login successful!' });
                } else {
                    return res.status(401).json({ message: 'Invalid username or password.' });
                }
            });
        } else {
            return res.status(401).json({ message: 'Invalid username or password.' });
        }
    });
});

// Update profile route
app.post('/update-profile', (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ message: 'User is not logged in.' });
    }

    const { username, first_name, middle_name, last_name, suffix, password } = req.body;
    const userId = req.session.user.id;

    if (!userId) {
        return res.status(400).json({ message: 'User ID is missing' });
    }

    const updates = { username, first_name, middle_name, last_name, suffix };

    if (password) {
        bcrypt.hash(password, 10, (err, hashedPassword) => {
            if (err) {
                return res.status(500).json({ message: 'Error hashing password.' });
            }
            updates.password = hashedPassword;
            performUpdate(res, updates, userId);  // Call the performUpdate function
        });
    } else {
        performUpdate(res, updates, userId);  // Call the performUpdate function
    }
});

function performUpdate(res, updates, userId) {
    const query = 'UPDATE users SET ? WHERE id = ?';
    db.query(query, [updates, userId], (err, result) => {
        if (err) {
            return res.status(500).json({ message: 'Error updating profile.' });
        }

        db.query('SELECT * FROM users WHERE id = ?', [userId], (err, results) => {
            if (err || results.length === 0) {
                return res.status(500).json({ message: 'Error fetching updated user data.' });
            }

            const updatedUser = results[0];
            res.status(200).json({ message: 'Profile updated successfully!', user: updatedUser });
        });
    });
}

// Logout route
app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ message: 'Error logging out.' });
        }
        res.redirect('/login');
    });
});

// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});