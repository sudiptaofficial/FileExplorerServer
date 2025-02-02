const mongoose = require("mongoose");

const fileSchema = new mongoose.Schema({
    name: { type: String, required: true },
    type: { type: String, enum: ['file', 'folder'], required: true },
    parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'File', default: null },
    data: { type: Buffer }, // only for files
    size: { type: Number }, // file size in bytes (only for files)
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("File", fileSchema);
