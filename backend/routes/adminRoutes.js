const express = require('express');
const router = express.Router();
const Admin = require('../models/Admin');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

// Create initial admin account
router.post('/setup', async (req, res) => {
    try {
        console.log('Starting admin setup...');
        
        // Check MongoDB connection
        if (mongoose.connection.readyState !== 1) {
            console.error('MongoDB not connected. Connection state:', mongoose.connection.readyState);
            return res.status(500).json({ message: 'Database not connected' });
        }

        // First, delete any existing admin accounts
        const deleteResult = await Admin.deleteMany({});
        console.log('Deleted existing admin accounts:', deleteResult);

        const admin = new Admin({
            username: 'admin',
            password: 'Waheguru@9698'
        });

        console.log('Attempting to save admin:', admin);
        const savedAdmin = await admin.save();
        console.log('Created new admin account:', savedAdmin);
        
        // Verify the admin was created
        const verifyAdmin = await Admin.findOne({ username: 'admin' });
        console.log('Verification - Found admin:', verifyAdmin);
        
        res.status(201).json({ 
            message: 'Admin account created successfully', 
            admin: savedAdmin,
            verified: verifyAdmin ? true : false
        });
    } catch (error) {
        console.error('Error creating admin:', error);
        res.status(500).json({ message: error.message });
    }
});

// Admin credentials
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'Waheguru@9698';

// Login route
router.post('/login', (req, res) => {
    const { username, password } = req.body;
    
    console.log('Login attempt:', { username, password }); // Debug log

    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
        res.json({ success: true });
    } else {
        res.status(401).json({ 
            success: false, 
            message: 'Invalid credentials' 
        });
    }
});

// Check admin status
router.get('/check', (req, res) => {
    res.json({ message: 'Admin check endpoint' });
});

module.exports = router; 