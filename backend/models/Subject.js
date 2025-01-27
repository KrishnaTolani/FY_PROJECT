const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    papers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Paper'
    }]
}, { timestamps: true });

module.exports = mongoose.model('Subject', subjectSchema); 