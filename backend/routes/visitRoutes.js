const express = require('express');
const router = express.Router();
const Visit = require('../models/Visit');

// Track a new visit
router.post('/track', async (req, res) => {
    try {
        let visit = await Visit.findOne();
        if (!visit) {
            visit = new Visit({ count: 1 });
        } else {
            visit.count += 1;
            visit.lastVisit = new Date();
        }
        await visit.save();
        res.status(200).json({ message: 'Visit tracked successfully' });
    } catch (error) {
        console.error('Error tracking visit:', error);
        res.status(500).json({ message: 'Error tracking visit' });
    }
});

// Get visit statistics (protected route for admin)
router.get('/stats', async (req, res) => {
    try {
        const visit = await Visit.findOne();
        if (!visit) {
            return res.json({ count: 0, lastVisit: null });
        }
        res.json({
            count: visit.count,
            lastVisit: visit.lastVisit
        });
    } catch (error) {
        console.error('Error fetching visit stats:', error);
        res.status(500).json({ message: 'Error fetching visit statistics' });
    }
});

module.exports = router; 