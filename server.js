require('dotenv').config(); // Load environment variables first
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3001;
const cors = require('cors');

require('./src/config/db');


app.use(express.json()); // Middleware to parse JSON request bodies
app.use(cors()); // Enable CORS for all routes

// Import routes
const authRoutes = require('./src/routes/authRoutes');

// Use routes
app.use('/api/auth', authRoutes);

app.get('/', (req, res) => {
    res.send('Automated Onboarding Backend is Running!');
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});