const File =  require('../models/file');
const archiver = require('archiver');


/**
 * Create a new folder.
 * Expects JSON: { name, parentId }  
 * (parentId can be null or omitted for a root-level folder)
 */
exports.createFolder = async (req, res) => {
    try {
      const { name, parentId } = req.body;
      const folder = new File({ name, type: 'folder', parentId: parentId || null });
      await folder.save();
      res.status(201).json(folder);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  };
  
  /**
   * Upload a new file.
   * Expects multipart/form-data with field "file" (the file) and "parentId" in the body.
   */
  exports.uploadFile = async (req, res) => {
    try {
      const { parentId } = req.body;
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      const file = new File({
        name: req.file.originalname,
        type: 'file',
        parentId: parentId || null,
        data: req.file.buffer
      });
      await file.save();
      res.status(201).json(file);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  };
  
  /**
   * Get files and folders.
   * Accepts query parameter "parentId". If not provided, fetches root-level items.
   */
  exports.getFiles = async (req, res) => {
    try {
      const { parentId } = req.query;
      const query = parentId ? { parentId } : { parentId: null };
      const files = await File.find(query);
      res.json(files);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  };
  
  /**
   * Rename a file or folder.
   * Expects JSON: { name }
   */
  exports.renameFile = async (req, res) => {
    try {
      const { name } = req.body;
      const file = await File.findByIdAndUpdate(req.params.id, { name }, { new: true });
      res.json(file);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  };
  
  /**
   * Recursively delete a file/folder.
   * If a folder, it deletes all children recursively.
   */
  const deleteRecursively = async (id) => {
    const file = await File.findById(id);
    if (file.type === 'folder') {
      const children = await File.find({ parentId: id });
      for (const child of children) {
        await deleteRecursively(child._id);
      }
    }
    await File.findByIdAndDelete(id);
  };
  
  exports.deleteFile = async (req, res) => {
    try {
      await deleteRecursively(req.params.id);
      res.json({ message: "Deleted successfully" });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  };
  
  /**
   * Download a file or folder.
   * For a file: returns the file bytes.
   * For a folder: zips the folder contents (including nested folders/files) and downloads the zip.
   */
  const getFolderContents = async (parentId, basePath = '') => {
    // Recursively collect files inside the folder.
    let files = [];
    const children = await File.find({ parentId });
    for (const child of children) {
      if (child.type === 'file') {
        files.push({ path: basePath + child.name, buffer: child.data });
      } else if (child.type === 'folder') {
        const nested = await getFolderContents(child._id, basePath + child.name + '/');
        files = files.concat(nested);
      }
    }
    return files;
  };
  
  exports.downloadFile = async (req, res) => {
    try {
      const file = await File.findById(req.params.id);
      if (!file) return res.status(404).json({ message: "Not found" });
  
      if (file.type === 'file') {
        // Set headers and send file bytes
        res.set({
          "Content-Disposition": `attachment; filename="${file.name}"`,
          "Content-Type": "application/octet-stream"
        });
        return res.send(file.data);
      } else if (file.type === 'folder') {
        // Zip folder contents for download
        const filesList = await getFolderContents(file._id, '');
        res.set({
          "Content-Disposition": `attachment; filename="${file.name}.zip"`,
          "Content-Type": "application/zip"
        });
  
        const archive = archiver('zip', { zlib: { level: 9 } });
        archive.on('error', err => res.status(500).send({ message: err.message }));
        archive.pipe(res);
  
        filesList.forEach(fileItem => {
          archive.append(fileItem.buffer, { name: fileItem.path });
        });
        archive.finalize();
      }
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  };