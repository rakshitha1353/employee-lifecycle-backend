// src/controllers/authController.js
const db = require('../config/db'); // Your database connection
const bcrypt = require('bcryptjs'); // For password hashing
const jwt = require('jsonwebtoken'); // For JWT token generation

// Register a new company and admin user
exports.register = async (req, res) => {
    const { companyName, adminEmail, password } = req.body;

    // Basic validation
    if (!companyName || !adminEmail || !password) {
        return res.status(400).json({ message: 'Please provide company name, admin email, and password.' });
    }

    try {
        // 1. Check if company or admin email already exists
        const companyExists = await db.query('SELECT id FROM companies WHERE name = $1', [companyName]);
        if (companyExists.rows.length > 0) {
            return res.status(409).json({ message: 'Company with this name already exists.' });
        }

        const userExists = await db.query('SELECT id FROM users WHERE email = $1', [adminEmail]);
        if (userExists.rows.length > 0) {
            return res.status(409).json({ message: 'User with this email already exists.' });
        }

        // 2. Hash password
        const salt = await bcrypt.genSalt(10); // Generate a salt
        const passwordHash = await bcrypt.hash(password, salt); // Hash the password

        // 3. Start a database transaction (to ensure both company and user are created or neither are)
        await db.query('BEGIN');

        // 4. Create the new company
        const companyResult = await db.query(
            'INSERT INTO companies (name, admin_email) VALUES ($1, $2) RETURNING id',
            [companyName, adminEmail]
        );
        const companyId = companyResult.rows[0].id; // Get the ID of the newly created company

        // 5. Create the admin user for this company
        await db.query(
            'INSERT INTO users (company_id, email, password_hash, role) VALUES ($1, $2, $3, $4)',
            [companyId, adminEmail, passwordHash, 'admin'] // Default role 'admin'
        );

        // 6. Commit the transaction if all operations were successful
        await db.query('COMMIT');

        res.status(201).json({ message: 'Company and admin user registered successfully.' });

    } catch (error) {
        // If any error occurs, rollback the transaction to prevent partial data
        await db.query('ROLLBACK');
        console.error('Error during registration:', error);
        res.status(500).json({ message: 'Server error during registration.' });
    }
};

// Login an existing user
exports.login = async (req, res) => {
    const { email, password } = req.body;

    // Basic validation
    if (!email || !password) {
        return res.status(400).json({ message: 'Please provide email and password.' });
    }

    try {
        // 1. Find user by email
        const userResult = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        const user = userResult.rows[0];

        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials.' }); // User not found
        }

        // 2. Compare the provided password with the hashed password in the database
        const isMatch = await bcrypt.compare(password, user.password_hash);

        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials.' }); // Passwords don't match
        }

        // 3. Generate a JWT token for the user session
        // The token payload includes user ID, company ID, and role - crucial for later authorization
        const token = jwt.sign(
            { userId: user.id, companyId: user.company_id, role: user.role },
            process.env.JWT_SECRET, // Use your JWT_SECRET from .env
            { expiresIn: '1h' } // Token expires in 1 hour (adjust as needed)
        );

        // 4. Update last login time (optional but good for auditing)
        await db.query('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1', [user.id]);

        res.status(200).json({
            message: 'Login successful',
            token, // Send the token back to the client
            user: { id: user.id, email: user.email, role: user.role, companyId: user.company_id } // Send essential user info
        });

    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).json({ message: 'Server error during login.' });
    }
};