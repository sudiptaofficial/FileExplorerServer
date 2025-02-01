// routes/fileRoutes.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

const {
  createFolder,
  uploadFile,
  getFiles,
  renameFile,
  deleteFile,
  downloadFile
} = require('../controllers/FileController');

router.post('/folder', createFolder);
router.post('/file', upload.single('file'), uploadFile);
router.get('/files', getFiles);
router.put('/file/:id', renameFile);
router.delete('/file/:id', deleteFile);
router.get('/download/:id', downloadFile);

module.exports = router;
