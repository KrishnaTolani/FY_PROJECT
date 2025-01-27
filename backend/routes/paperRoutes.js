const express = require('express');
const router = express.Router();
const Paper = require('../models/Paper');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for file upload
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, path.join(__dirname, '../uploads/'));
    },
    filename: function(req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

// Add file filter
const fileFilter = (req, file, cb) => {
    // Accept pdf, jpg, jpeg, png
    if (file.mimetype === 'application/pdf' || 
        file.mimetype === 'image/jpeg' || 
        file.mimetype === 'image/png') {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only PDF, JPG, JPEG, PNG are allowed.'), false);
    }
};

const upload = multer({ 
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});

// Get all papers
router.get('/', async (req, res) => {
    try {
        const papers = await Paper.find();
        res.json(papers);
    } catch (error) {
        console.error('Get papers error:', error);
        res.status(500).json({ message: error.message });
    }
});

// Upload new paper
router.post('/', upload.single('paper'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const { subject, year, semester } = req.body;
        const fileUrl = `/uploads/${req.file.filename}`;

        const paper = new Paper({
            subject,
            year,
            semester,
            fileUrl,
            fileName: req.file.filename
        });

        const newPaper = await paper.save();
        console.log('Paper saved successfully:', newPaper);
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

// Add this route to delete a single paper
router.delete('/:id', async (req, res) => {
    try {
        const paper = await Paper.findById(req.params.id);
        if (!paper) {
            return res.status(404).json({ message: 'Paper not found' });
        }
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