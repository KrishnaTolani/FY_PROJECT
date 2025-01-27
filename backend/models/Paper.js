const mongoose = require('mongoose');

const paperSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    fileName: {
        type: String,
        required: true
    },
    subject: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subject',
        required: true
    }
}, { timestamps: true });

module.exports = mongoose.model('Paper', paperSchema); 