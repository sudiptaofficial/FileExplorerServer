// routes/fileRoutes.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });
const authMiddleware = require("../Middleware/auth");

const {
  createFolder,
  uploadFile,
  getFiles,
  renameFile,
  deleteFile,
  downloadFile
} = require('../controllers/FileController');

// All file routes require authentication
router.post('/folder', authMiddleware, createFolder);
router.post('/file', authMiddleware, upload.single('file'), uploadFile);
router.get('/files', authMiddleware, getFiles);
router.put('/file/:id', authMiddleware, renameFile);
router.delete('/file/:id', authMiddleware, deleteFile);
router.get('/download/:id', authMiddleware, downloadFile);

module.exports = router;
