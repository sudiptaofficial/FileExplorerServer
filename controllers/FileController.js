const File =  require('../models/file');
const archiver = require('archiver');


exports.createFolder = async (req, res) => {
  try {
    const { name, parentId } = req.body;
    const parsedParentId = parentId === "null" ? null : parentId;
    const folder = new File({
      name,
      type: 'folder',
      parentId: parsedParentId,
      user: req.user._id
    });
    await folder.save();
    res.status(201).json(folder);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * Upload a new file.
 */
exports.uploadFile = async (req, res) => {
  try {
    let { parentId, relativePath } = req.body;
    // Convert string "null" to actual null.
    let parentIdParsed = parentId === "null" ? null : parentId;

    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    // If a relativePath is provided, create the folder structure recursively.
    // Example: relativePath = "folderA/folderB"
    if (relativePath) {
      const folders = relativePath.split('/').filter(Boolean);
      for (const folderName of folders) {
        // Check if folder already exists for this user and parent.
        let folder = await File.findOne({ 
          name: folderName, 
          type: 'folder', 
          parentId: parentIdParsed, 
          user: req.user._id 
        });
        if (!folder) {
          folder = new File({
            name: folderName,
            type: 'folder',
            parentId: parentIdParsed,
            user: req.user._id
          });
          await folder.save();
        }
        parentIdParsed = folder._id;
      }
    }

    const file = new File({
      name: req.file.originalname,
      type: 'file',
      parentId: parentIdParsed,
      data: req.file.buffer,
      size: req.file.size, // store the file size in bytes
      user: req.user._id
    });
    await file.save();
    res.status(201).json(file);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * Get files and folders for the logged in user.
 */
exports.getFiles = async (req, res) => {
  try {
    const { parentId } = req.query;
    const query = {
      parentId: parentId ? parentId : null,
      user: req.user._id
    };
    const files = await File.find(query);
    res.json(files);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * Rename a file or folder.
 */
exports.renameFile = async (req, res) => {
  try {
    const { name } = req.body;
    // Find the file/folder belonging to the user.
    let file = await File.findOne({ _id: req.params.id, user: req.user._id });
    if (!file) return res.status(404).json({ message: "Not found" });

    if (file.type === 'file') {
      // Preserve the original extension.
      const originalParts = file.name.split('.');
      const originalExt = originalParts.length > 1 ? originalParts.pop() : "";
      // Remove any extension the user might have entered.
      const newBase = name.includes('.') ? name.split('.').slice(0, -1).join('.') : name;
      file.name = originalExt ? `${newBase}.${originalExt}` : newBase;
    } else {
      // For folders, allow full renaming.
      file.name = name;
    }

    await file.save();
    res.json(file);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * Recursively delete a file/folder.
 */
const deleteRecursively = async (id, userId) => {
  const file = await File.findOne({ _id: id, user: userId });
  if (file.type === 'folder') {
    const children = await File.find({ parentId: id, user: userId });
    for (const child of children) {
      await deleteRecursively(child._id, userId);
    }
  }
  await File.findOneAndDelete({ _id: id, user: userId });
};

exports.deleteFile = async (req, res) => {
  try {
    await deleteRecursively(req.params.id, req.user._id);
    res.json({ message: "Deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * Download a file or folder.
 */
const getFolderContents = async (parentId, userId, basePath = '') => {
  let files = [];
  const children = await File.find({ parentId, user: userId });
  for (const child of children) {
    if (child.type === 'file') {
      files.push({ path: basePath + child.name, buffer: child.data });
    } else if (child.type === 'folder') {
      const nested = await getFolderContents(child._id, userId, basePath + child.name + '/');
      files = files.concat(nested);
    }
  }
  return files;
};

exports.downloadFile = async (req, res) => {
  try {
    const file = await File.findOne({ _id: req.params.id, user: req.user._id });
    if (!file) return res.status(404).json({ message: "Not found" });

    if (file.type === 'file') {
      res.set({
        "Content-Disposition": `attachment; filename="${file.name}"`,
        "Content-Type": "application/octet-stream"
      });
      return res.send(file.data);
    } else if (file.type === 'folder') {
      const filesList = await getFolderContents(file._id, req.user._id, '');
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