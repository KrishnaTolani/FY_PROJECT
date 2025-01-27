const express = require('express');
const router = express.Router();
const Paper = require('../models/Paper');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Initialize Firebase Storage
const admin = require('firebase-admin');
const serviceAccount = require('../config/firebase-key.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: 'your-project-id.appspot.com'
});

const bucket = admin.storage().bucket();

// Configure multer for temporary file upload
const storage = multer.memoryStorage();
const upload = multer({ 
    storage: storage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf' || 
            file.mimetype === 'image/jpeg' || 
            file.mimetype === 'image/png') {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only PDF, JPG, JPEG, PNG are allowed.'), false);
        }
    },
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});

// Get all papers
router.get('/', async (req, res) => {
    try {
        const papers = await Paper.find().populate('subject');
        res.json(papers);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Upload new paper
router.post('/', upload.single('paper'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const { subject, title } = req.body;
        
        // Create unique filename
        const fileName = `${Date.now()}-${req.file.originalname}`;
        const fileBuffer = req.file.buffer;

        // Upload to Firebase Storage
        const file = bucket.file(`papers/${fileName}`);
        await file.save(fileBuffer);

        // Make the file publicly accessible
        await file.makePublic();

        // Get public URL
        const publicUrl = `https://storage.googleapis.com/${bucket.name}/papers/${fileName}`;

        const paper = new Paper({
            title,
            subject,
            fileName,
            fileUrl: publicUrl
        });

        const newPaper = await paper.save();
        res.status(201).json(newPaper);
    } catch (error) {
        console.error('Upload error:', error);
        res.status(400).json({ message: error.message });
    }
});

// Download paper
router.get('/download/:id', async (req, res) => {
    try {
        const paper = await Paper.findById(req.params.id);
        if (!paper) {
            return res.status(404).json({ message: 'Paper not found' });
        }

        // Increment download count
        paper.downloadCount += 1;
        await paper.save();

        const filePath = path.join(__dirname, '..', paper.fileUrl);
        res.download(filePath);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Add this new route to delete all papers
router.delete('/deleteAll', async (req, res) => {
    try {
        await Paper.deleteMany({});
        // Also delete files from uploads folder
        const path = require('path');
        const directory = path.join(__dirname, '../uploads');
        fs.readdir(directory, (err, files) => {
            if (err) throw err;
            for (const file of files) {
                fs.unlink(path.join(directory, file), err => {
                    if (err) throw err;
                });
            }
        });
        res.json({ message: 'All papers deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Delete paper
router.delete('/:id', async (req, res) => {
    try {
        const paper = await Paper.findById(req.params.id);
        if (!paper) {
            return res.status(404).json({ message: 'Paper not found' });
        }

        // Delete from Firebase Storage
        const file = bucket.file(`papers/${paper.fileName}`);
        await file.delete();

        await paper.remove();
        res.json({ message: 'Paper deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Error handling middleware
router.use((error, req, res, next) => {
    console.error('Route error:', error);
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ message: 'File is too large. Maximum size is 5MB' });
        }
        return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Something went wrong' });
});

module.exports = router; 