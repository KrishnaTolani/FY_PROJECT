require('dotenv').config({ path: __dirname + '/.env' });
const express = require('express');
const cors = require('cors');
const path = require('path');
const mongoose = require('mongoose');
const fs = require('fs');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from frontend
app.use(express.static(path.join(__dirname, '../frontend')));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Global variable to track MongoDB connection status
let isMongoConnected = false;

// Connect to MongoDB with retry logic
const connectWithRetry = async () => {
    try {
        if (!process.env.MONGODB_URI) {
            throw new Error('MONGODB_URI is not defined in environment variables');
        }
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');
        isMongoConnected = true;
    } catch (error) {
        console.error('MongoDB connection error:', error);
        isMongoConnected = false;
        // Retry connection after 5 seconds
        console.log('Retrying connection in 5 seconds...');
        setTimeout(connectWithRetry, 5000);
    }
};

// Initial connection attempt
connectWithRetry();

// Monitor MongoDB connection
mongoose.connection.on('connected', () => {
    console.log('MongoDB connected');
    isMongoConnected = true;
});

mongoose.connection.on('error', (err) => {
    console.error('MongoDB connection error:', err);
    isMongoConnected = false;
});

mongoose.connection.on('disconnected', () => {
    console.log('MongoDB disconnected');
    isMongoConnected = false;
    // Try to reconnect
    setTimeout(connectWithRetry, 5000);
});

// Middleware to check MongoDB connection
const checkMongoConnection = (req, res, next) => {
    if (!isMongoConnected && req.path.startsWith('/api/')) {
        return res.status(503).json({
            error: 'Database connection unavailable',
            message: 'The service is temporarily unavailable. Please try again later.'
        });
    }
    next();
};

app.use(checkMongoConnection);

// Routes
const subjectRoutes = require('./routes/subjectRoutes');
const adminRoutes = require('./routes/adminRoutes');
const visitRoutes = require('./routes/visitRoutes');

app.use('/api/subjects', subjectRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/visits', visitRoutes);

// Serve index.html for root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/student.html'));
});

// Serve admin.html for /admin route
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/admin.html'));
});

// Serve admin-login.html for /admin-login route
app.get('/admin-login', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/admin-login.html'));
});

// Serve papers.html for /papers route
app.get('/papers', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/papers.html'));
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'UP',
        mongodb: isMongoConnected ? 'Connected' : 'Disconnected',
        timestamp: new Date()
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ 
        message: 'Something went wrong!',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log('Frontend directory:', path.join(__dirname, '../frontend'));
    console.log('Uploads directory:', path.join(__dirname, 'uploads'));
}); 