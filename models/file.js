const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema({
    name: { type: String, required: true },
    type: { type: String, enum: ['file', 'folder'], required: true },
    parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'File', default: null },
    data: { type: Buffer }, // only for files
    createdAt: { type: Date, default: Date.now }
})

module.exports = mongoose.model('File', fileSchema);