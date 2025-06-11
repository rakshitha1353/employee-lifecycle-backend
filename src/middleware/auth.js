// src/middleware/auth.js
const jwt = require('jsonwebtoken'); // For JWT token verification

// Middleware to protect routes (checks if user is logged in)
exports.protect = (req, res, next) => {
    let token;

    // 1. Check if token exists in the Authorization header (Bearer token)
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1]; // Extract the token part
    }

    // 2. If no token, send 401 Unauthorized
    if (!token) {
        return res.status(401).json({ message: 'Not authorized, no token provided' });
    }

    try {
        // 3. Verify the token using your JWT_SECRET
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // 4. Attach decoded user info (userId, companyId, role) to the request object
        // This makes user data available in subsequent route handlers
        req.userId = decoded.userId;
        req.companyId = decoded.companyId;
        req.role = decoded.role;

        next(); // Proceed to the next middleware or route handler

    } catch (error) {
        console.error('Token verification failed:', error);
        res.status(401).json({ message: 'Not authorized, token failed or expired' });
    }
};

// Middleware for role-based authorization (optional for MVP, but good practice)
// This checks if the authenticated user has one of the allowed roles
exports.authorize = (roles = []) => {
    // Ensure roles is an array
    if (typeof roles === 'string') {
        roles = [roles];
    }

    return (req, res, next) => {
        // If no specific roles are required, or if the user's role is in the allowed roles
        if (roles.length > 0 && !roles.includes(req.role)) {
            return res.status(403).json({ message: 'Forbidden, insufficient role permissions' });
        }
        next(); // User is authorized, proceed
    };
};