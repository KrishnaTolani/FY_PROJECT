const mongoose = require('mongoose');

const visitSchema = new mongoose.Schema({
    count: {
        type: Number,
        default: 0
    },
    lastVisit: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

module.exports = mongoose.model('Visit', visitSchema); 