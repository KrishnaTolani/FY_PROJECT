const express = require('express');
const router = express.Router();
const Subject = require('../models/Subject');
const Paper = require('../models/Paper');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for file upload
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, '../../frontend/uploads');
        // Create uploads directory if it doesn't exist
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        // Create unique filename with original name and timestamp
        const timestamp = Date.now();
        const safeName = file.originalname.replace(/[^a-zA-Z0-9.]/g, '-');
        cb(null, `${timestamp}-${safeName}`);
    }
});

const upload = multer({
    storage: storage,
    fileFilter: function(req, file, cb) {
        // Accept only PDF files
        if (!file.originalname.match(/\.(pdf)$/)) {
            return cb(new Error('Only PDF files are allowed!'), false);
        }
        cb(null, true);
    },
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    }
}).single('paper');

// Get all subjects with their papers
router.get('/', async (req, res) => {
    try {
        const subjects = await Subject.find().populate({
            path: 'papers',
            model: 'Paper'
        });
        res.json(subjects);
    } catch (error) {
        console.error('Error fetching subjects:', error);
        res.status(500).json({ message: 'Error fetching subjects' });
    }
});

// Create a new subject
router.post('/', async (req, res) => {
    try {
        const subject = new Subject({
            name: req.body.name,
            papers: []
        });
        const newSubject = await subject.save();
        res.status(201).json(newSubject);
    } catch (error) {
        console.error('Error creating subject:', error);
        res.status(400).json({ message: 'Error creating subject' });
    }
});

// Upload a paper
router.post('/upload', (req, res) => {
    upload(req, res, async function(err) {
        if (err instanceof multer.MulterError) {
            console.error('Multer error:', err);
            return res.status(400).json({ message: 'File upload error: ' + err.message });
        } else if (err) {
            console.error('Unknown error:', err);
            return res.status(400).json({ message: 'Only PDF files are allowed' });
        }

        // If no file was uploaded
        if (!req.file) {
            return res.status(400).json({ message: 'Please upload a PDF file' });
        }

        try {
            // Check if subject exists
            const subject = await Subject.findById(req.body.subject);
            if (!subject) {
                fs.unlinkSync(req.file.path);
                return res.status(404).json({ message: 'Subject not found' });
            }

            // Create new paper document
            const paper = new Paper({
                title: req.body.title,
                fileName: req.file.filename,
                subject: subject._id
            });

            // Save the paper
            const savedPaper = await paper.save();
            
            // Add paper to subject's papers array
            subject.papers.push(savedPaper._id);
            await subject.save();

            // Return the saved paper with populated subject
            const populatedPaper = await Paper.findById(savedPaper._id).populate('subject');
            res.status(201).json(populatedPaper);

        } catch (error) {
            console.error('Error saving paper:', error);
            // Delete uploaded file if there's an error
            if (req.file) {
                try {
                    fs.unlinkSync(req.file.path);
                } catch (unlinkError) {
                    console.error('Error deleting file after failed upload:', unlinkError);
                }
            }
            res.status(500).json({ message: 'Error saving paper: ' + error.message });
        }
    });
});

// Delete a subject and all its papers
router.delete('/:id', async (req, res) => {
    try {
        const subject = await Subject.findById(req.params.id).populate('papers');
        
        if (!subject) {
            return res.status(404).json({ message: 'Subject not found' });
        }

        // Delete all paper files and documents
        for (const paper of subject.papers) {
            try {
                const filePath = path.join(__dirname, '../../frontend/uploads', paper.fileName);
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
                await Paper.findByIdAndDelete(paper._id);
            } catch (err) {
                console.error('Error deleting paper:', err);
            }
        }

        // Delete the subject
        await Subject.findByIdAndDelete(req.params.id);
        
        res.json({ message: 'Subject and all associated papers deleted successfully' });
    } catch (error) {
        console.error('Error deleting subject:', error);
        res.status(500).json({ message: 'Error deleting subject: ' + error.message });
    }
});

// Delete a paper from a subject
router.delete('/:subjectId/papers/:paperId', async (req, res) => {
    try {
        // Find the subject and paper
        const subject = await Subject.findById(req.params.subjectId);
        const paper = await Paper.findById(req.params.paperId);

        if (!subject) {
            return res.status(404).json({ message: 'Subject not found' });
        }
        if (!paper) {
            return res.status(404).json({ message: 'Paper not found' });
        }

        // Delete paper file
        try {
            const filePath = path.join(__dirname, '../../frontend/uploads', paper.fileName);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        } catch (err) {
            console.error('Error deleting paper file:', err);
        }

        // Remove paper from subject's papers array
        subject.papers = subject.papers.filter(p => p.toString() !== req.params.paperId);
        await subject.save();

        // Delete paper document
        await Paper.findByIdAndDelete(req.params.paperId);

        res.json({ message: 'Paper deleted successfully' });
    } catch (error) {
        console.error('Error deleting paper:', error);
        res.status(500).json({ message: 'Error deleting paper: ' + error.message });
    }
});

module.exports = router; 