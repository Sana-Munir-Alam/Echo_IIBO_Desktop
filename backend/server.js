// SERVER.JS
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();

// ====================
// MULTER CONFIGURATION
// ====================
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('📁 Created uploads directory');
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'text/plain',
    'text/x-c++src',
    'image/jpeg',
    'image/png',
    'image/gif',
    'video/mp4',
    'video/x-msvideo',
    'video/quicktime',
    'application/pdf'
  ];
  
  if (allowedTypes.includes(file.mimetype) || 
      file.originalname.match(/\.(txt|cpp|jpg|jpeg|png|gif|mp4|avi|mov|pdf)$/i)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only txt, cpp, jpg, png, gif, mp4, avi, mov, and pdf files are allowed.'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024
  },
  fileFilter: fileFilter
});

// ====================
// MIDDLEWARE
// ====================
// app.use(cors({
//   origin: process.env.FRONTEND_URL || 'http://localhost:3000',
//   credentials: true
// }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use('/incognito-desktop/uploads', express.static(uploadsDir));
app.use(cors());
// ====================
// MONGODB CONNECTION
// ====================
console.log('🔗 Connecting to MongoDB...');

mongoose.connect(process.env.MONGODB_URI)
.then(() => {
  console.log('✅ MongoDB Connected Successfully!');
  console.log(`📊 Database: ${mongoose.connection.name}`);
  initializeDefaultData();
})
.catch(err => {
  console.error('❌ MongoDB Connection Failed:', err.message);
  process.exit(1);
});

const fileSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  type: { type: String, required: true, enum: ['folder', 'txt', 'cpp', 'jpg', 'png', 'gif', 'mp4', 'avi', 'mov', 'pdf', 'other'] },
  content: { type: String, default: '' },
  filePath: { type: String, default: '' },
  path: { type: String, default: 'C:', required: true },
  size: { type: Number, default: 0 },
  isFolder: { type: Boolean, default: false },
  mimeType: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
  modifiedAt: { type: Date, default: Date.now },
  properties: {
    owner: { type: String, default: 'System Administrator' },
    passwordLocked: { type: Boolean, default: false },
    passwordKeys: { type: [String], default: [""] },  // NEW: Array of password strings
    additionalProperty: { type: String, default: 'NULL' }
  }
});

const File = mongoose.model('File', fileSchema);

const wallpaperSchema = new mongoose.Schema({
  currentWallpaper: {
    type: String,
    default: 'https://images.pexels.com/photos/206359/pexels-photo-206359.jpeg'
  },
  wallpapers: {
    type: [String],
    default: [
      'https://images.pexels.com/photos/206359/pexels-photo-206359.jpeg',
      'https://i0.wp.com/picjumbo.com/wp-content/uploads/beautiful-fall-nature-scenery-free-image.jpeg',
      'https://images.pexels.com/photos/751601/pexels-photo-751601.jpeg?cs=srgb&dl=pexels-grizzlybear-751601.jpg&fm=jpg'
    ]
  },
  lastUpdated: { type: Date, default: Date.now }
});

const Wallpaper = mongoose.model('Wallpaper', wallpaperSchema);



// ====================
// API ROUTES
// ====================

// Basic route for testing
app.get('/', (req, res) => {
  res.json({ message: 'Echo IIBO Desktop API is running!' });
});

app.get('/incognito-desktop/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    uploadsDir: uploadsDir
  });
});

app.get('/incognito-desktop/api/wallpaper', async (req, res) => {
  try {
    let wallpaper = await Wallpaper.findOne();
    
    if (!wallpaper) {
      wallpaper = await Wallpaper.create({
        currentWallpaper: 'https://images.pexels.com/photos/206359/pexels-photo-206359.jpeg'
      });
    }
    
    res.json({
      success: true,
      currentWallpaper: wallpaper.currentWallpaper,
      wallpapers: wallpaper.wallpapers
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.put('/incognito-desktop/api/wallpaper', async (req, res) => {
  try {
    const { wallpaperUrl } = req.body;
    
    if (!wallpaperUrl) {
      return res.status(400).json({ success: false, error: 'Wallpaper URL required' });
    }
    
    let wallpaper = await Wallpaper.findOne();
    
    if (!wallpaper) {
      wallpaper = new Wallpaper({ currentWallpaper: wallpaperUrl });
    } else {
      wallpaper.currentWallpaper = wallpaperUrl;
      wallpaper.lastUpdated = new Date();
    }
    
    await wallpaper.save();
    
    res.json({
      success: true,
      message: 'Wallpaper updated',
      currentWallpaper: wallpaper.currentWallpaper
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ====================
// AUTHENTICATION ROUTES
// ====================

// Sign In Endpoint
app.post('/incognito-desktop/api/auth/signin', async (req, res) => {
  try {
    const { password } = req.body;
    
    if (!password) {
      return res.status(400).json({ 
        success: false, 
        error: 'Password required' 
      });
    }
    
    // Get sign-in password from environment variable
    const correctPassword = process.env.SIGN_IN_PASSWORD || '1724';
    
    if (password === correctPassword) {
      console.log('✅ Sign in successful');
      return res.json({ 
        success: true, 
        message: 'Sign in successful' 
      });
    } else {
      console.log('❌ Sign in failed - incorrect password');
      return res.status(401).json({ 
        success: false, 
        error: 'Incorrect password' 
      });
    }
  } catch (error) {
    console.error('Sign in error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

app.get('/incognito-desktop/api/files', async (req, res) => {
  try {
    const dirPath = req.query.path || 'C:';
    console.log(`📂 Fetching files from: ${dirPath}`);
    
    const files = await File.find({ path: dirPath }).sort('name');
    
    res.json({
      success: true,
      path: dirPath,
      files: files,
      count: files.length
    });
  } catch (error) {
    console.error('Error fetching files:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/incognito-desktop/api/files/:id', async (req, res) => {
  try {
    const file = await File.findById(req.params.id);
    
    if (!file) {
      return res.status(404).json({ success: false, error: 'File not found' });
    }
    
    res.json({
      success: true,
      file: file
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/incognito-desktop/api/files/folder', async (req, res) => {
  try {
    const { name, path: folderPath = 'C:' } = req.body;
    
    if (!name || name.trim() === '') {
      return res.status(400).json({ success: false, error: 'Folder name required' });
    }
    
    const newFolder = new File({
      name: name.trim(),
      type: 'folder',
      path: folderPath,
      isFolder: true,
      properties: {
        owner: 'System Administrator',
        passwordLocked: false,
        additionalProperty: 'NULL'
      }
    });
    
    await newFolder.save();
    
    res.status(201).json({
      success: true,
      message: 'Folder created',
      folder: newFolder
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/incognito-desktop/api/files/text', async (req, res) => {
  try {
    const { name, path: filePath = 'C:', content = '' } = req.body;
    
    if (!name || name.trim() === '') {
      return res.status(400).json({ success: false, error: 'File name required' });
    }
    
    const fileName = name.endsWith('.txt') ? name : `${name}.txt`;
    
    const newFile = new File({
      name: fileName,
      type: 'txt',
      content: content,
      path: filePath,
      size: Buffer.byteLength(content, 'utf8'),
      isFolder: false,
      properties: {
        owner: 'System Administrator',
        passwordLocked: false,
        additionalProperty: 'NULL'
      }
    });
    
    await newFile.save();
    
    res.status(201).json({
      success: true,
      message: 'Text file created',
      file: newFile
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.put('/incognito-desktop/api/files/:id', async (req, res) => {
  try {
    const { content } = req.body;
    
    const file = await File.findById(req.params.id);
    
    if (!file) {
      return res.status(404).json({ success: false, error: 'File not found' });
    }
    
    file.content = content;
    file.size = Buffer.byteLength(content, 'utf8');
    file.modifiedAt = new Date();
    
    await file.save();
    
    res.json({
      success: true,
      message: 'File updated',
      file: file
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Save Code Working
app.post('/incognito-desktop/api/files/verify-save-code', async (req, res) => {
  try {
    const { saveCode } = req.body;
    
    if (!saveCode) {
      return res.status(400).json({ success: false, error: 'Save code required' });
    }
    
    if (saveCode !== process.env.SAVE_CODE) {
      return res.status(403).json({ success: false, error: 'Invalid save code' });
    }
    
    res.json({ success: true, message: 'Save code verified' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Rename Code Working
app.post('/incognito-desktop/api/files/verify-rename-code', async (req, res) => {
  try {
    const { renameCode } = req.body;
    
    if (!renameCode) {
      return res.status(400).json({ success: false, error: 'Rename code required' });
    }
    
    if (renameCode !== process.env.RENAME_CODE) {
      return res.status(403).json({ success: false, error: 'Invalid rename code' });
    }
    
    res.json({ success: true, message: 'Rename code verified' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.put('/incognito-desktop/api/files/:id/rename', async (req, res) => {
  try {
    const { renameCode, newName } = req.body;
    
    if (!renameCode) {
      return res.status(400).json({ success: false, error: 'Rename code required' });
    }
    
    if (renameCode !== process.env.RENAME_CODE) {
      return res.status(403).json({ success: false, error: 'Invalid rename code' });
    }
    
    if (!newName || newName.trim() === '') {
      return res.status(400).json({ success: false, error: 'New name required' });
    }
    
    const file = await File.findById(req.params.id);
    
    if (!file) {
      return res.status(404).json({ success: false, error: 'File not found' });
    }
    
    const trimmedNewName = newName.trim();
    
    const getExtension = (filename) => {
      const lastDot = filename.lastIndexOf('.');
      return lastDot > 0 ? filename.substring(lastDot).toLowerCase() : '';
    };
    
    const oldExtension = getExtension(file.name);
    const newExtension = getExtension(trimmedNewName);
    
    if (!file.isFolder && oldExtension !== newExtension) {
      return res.status(400).json({ 
        success: false, 
        error: `File extension must remain ${oldExtension || 'the same'}. New name should end with ${oldExtension}` 
      });
    }
    
    const existingFile = await File.findOne({ 
      name: trimmedNewName, 
      path: file.path,
      _id: { $ne: file._id }
    });
    
    if (existingFile) {
      const itemType = file.isFolder ? 'folder' : 'file';
      return res.status(400).json({ 
        success: false, 
        error: `A ${itemType} with the name "${trimmedNewName}" already exists in this location` 
      });
    }
    
    const oldName = file.name;
    file.name = trimmedNewName;
    file.modifiedAt = new Date();
    
    await file.save();
    
    console.log(`✏️ Renamed: "${oldName}" → "${trimmedNewName}" in ${file.path}`);
    
    res.json({
      success: true,
      message: 'File renamed successfully',
      file: file,
      oldName: oldName
    });
  } catch (error) {
    console.error('Rename error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete Code working
app.delete('/incognito-desktop/api/files/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { deletionCode } = req.body;
    
    if (!deletionCode) {
      return res.status(400).json({ success: false, error: 'Deletion code required' });
    }
    
    if (deletionCode !== process.env.DELETION_CODE) {
      return res.status(403).json({ success: false, error: 'Invalid deletion code' });
    }
    
    const file = await File.findById(id);
    
    if (!file) {
      return res.status(404).json({ success: false, error: 'File not found' });
    }
    
    if (file.filePath && !file.isFolder) {
      const fullPath = path.join(__dirname, file.filePath);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
        console.log(`🗑️ Deleted physical file: ${fullPath}`);
      }
    }
    
    await File.findByIdAndDelete(id);
    
    res.json({
      success: true,
      message: 'File deleted',
      deletedFile: {
        id: file._id,
        name: file.name
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/incognito-desktop/api/files/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }
    
    const { path: filePath = 'C:\\Desktop' } = req.body;
    
    const extension = path.extname(req.file.originalname).toLowerCase().substring(1);
    const typeMap = {
      'txt': 'txt',
      'cpp': 'cpp',
      'jpg': 'jpg',
      'jpeg': 'jpg',
      'png': 'png',
      'gif': 'gif',
      'mp4': 'mp4',
      'avi': 'avi',
      'mov': 'mov',
      'pdf': 'pdf'
    };
    
    const fileType = typeMap[extension] || 'other';
    
    let content = '';
    if (fileType === 'txt' || fileType === 'cpp') {
      content = fs.readFileSync(req.file.path, 'utf8');
    }
    
    const newFile = new File({
      name: req.file.originalname,
      type: fileType,
      content: content,
      filePath: 'uploads/' + req.file.filename,
      path: filePath,
      size: req.file.size,
      mimeType: req.file.mimetype,
      isFolder: false,
      properties: {
        owner: 'System Administrator',
        passwordLocked: false,
        additionalProperty: 'NULL'
      }
    });
    
    await newFile.save();
    
    console.log(`✅ File uploaded: ${req.file.originalname} (${(req.file.size / 1024 / 1024).toFixed(2)} MB)`);
    
    res.status(201).json({
      success: true,
      message: 'File uploaded',
      file: newFile
    });
  } catch (error) {
    console.error('Upload error:', error);
    
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({ success: false, error: error.message });
  }
});

// Serve file content (for Terminal and viewing)
app.get('/incognito-desktop/api/files/:id/content', async (req, res) => {
  try {
    const file = await File.findById(req.params.id);
    
    if (!file) {
      return res.status(404).json({ success: false, error: 'File not found' });
    }
    
    if (file.type === 'txt' || file.type === 'cpp') {
      res.json({
        success: true,
        content: file.content,
        type: 'text'
      });
      return;
    }
    
    if (file.filePath) {
      const fullPath = path.join(__dirname, file.filePath);
      if (fs.existsSync(fullPath)) {
        res.sendFile(fullPath);
      } else {
        res.status(404).json({ success: false, error: 'Physical file not found' });
      }
    } else {
      res.status(404).json({ success: false, error: 'File path not set' });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Add this endpoint to server.js after the existing file routes

// Password Validation Endpoint
app.post('/incognito-desktop/api/files/validate-password', async (req, res) => {
  try {
    const { fileId, passwords } = req.body;
    
    if (!fileId) {
      return res.status(400).json({ success: false, error: 'File ID required' });
    }
    
    if (!passwords || !Array.isArray(passwords)) {
      return res.status(400).json({ success: false, error: 'Passwords array required' });
    }
    
    const file = await File.findById(fileId);
    
    if (!file) {
      return res.status(404).json({ success: false, error: 'File not found' });
    }
    
    // If file is not password locked, allow access
    if (!file.properties?.passwordLocked) {
      return res.json({ success: true, valid: true });
    }
    
    // Check if passwordKeys exist
    if (!file.properties.passwordKeys || !Array.isArray(file.properties.passwordKeys)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Password configuration error' 
      });
    }
    
    const expectedKeys = file.properties.passwordKeys;
    
    // Validate password count matches
    if (passwords.length !== expectedKeys.length) {
      return res.json({ 
        success: true, 
        valid: false,
        expectedCount: expectedKeys.length
      });
    }
    
    // Validate each password in order
    for (let i = 0; i < expectedKeys.length; i++) {
      if (passwords[i] !== expectedKeys[i]) {
        return res.json({ 
          success: true, 
          valid: false,
          failedAtIndex: i + 1
        });
      }
    }
    
    // All passwords correct
    return res.json({ 
      success: true, 
      valid: true 
    });
    
  } catch (error) {
    console.error('Password validation error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ====================
// ERROR HANDLING
// ====================
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ 
        success: false, 
        error: 'File too large. Maximum size is 50MB.' 
      });
    }
    return res.status(400).json({ 
      success: false, 
      error: `Upload error: ${err.message}` 
    });
  }
  
  if (err) {
    console.error('Server error:', err);
    return res.status(500).json({ 
      success: false, 
      error: err.message 
    });
  }
  
  next();
});

// ====================
// SERVE REACT BUILD FILES
// ====================
const clientBuildPath = path.join(__dirname, '../client/build');
app.use('/incognito-desktop', express.static(clientBuildPath));

// Catch-all route for React Router (must be last route)
app.get('/incognito-desktop/*', (req, res) => {
  res.sendFile(path.join(clientBuildPath, 'index.html'));
});

// ====================
// INITIALIZE DEFAULT DATA
// ====================
async function initializeDefaultData() {
  try {
    console.log('🎯 Initializing file system...');
    
    const structure = [
      { name: 'Desktop', type: 'folder', path: 'C:', isFolder: true },
      { name: 'Documents', type: 'folder', path: 'C:', isFolder: true },
      { name: 'Pictures', type: 'folder', path: 'C:', isFolder: true },
      { name: 'Videos', type: 'folder', path: 'C:', isFolder: true },
      { name: 'Downloads', type: 'folder', path: 'C:', isFolder: true },
      
      { name: 'Welcome.txt', type: 'txt', path: 'C:\\Desktop', isFolder: false, 
        content: 'Welcome to Windows Desktop!\n\nUse Terminal to navigate:\n- dir: list files\n- cd [folder]: change directory\n- type [file]: view file\n- start [file]: open file\n- prop [file]: show properties\n- cls: clear screen', 
        size: 180 },
      
      { name: 'Screenshots', type: 'folder', path: 'C:\\Pictures', isFolder: true },
      { name: 'Camera Roll', type: 'folder', path: 'C:\\Pictures', isFolder: true },
      { name: 'Recordings', type: 'folder', path: 'C:\\Videos', isFolder: true },
      { name: 'Decodings', type: 'folder', path: 'C:\\Videos', isFolder: true },
      
      { name: 'readme.txt', type: 'txt', path: 'C:\\Documents', isFolder: false, 
        content: 'This is a sample document file.\nYou can edit this in Notepad.', 
        size: 65 },
    ];
    
    for (const item of structure) {
      const exists = await File.findOne({ name: item.name, path: item.path });
      if (!exists) {
        await File.create({
          ...item,
          properties: {
            owner: 'System Administrator',
            passwordLocked: false,
            additionalProperty: 'NULL'
          }
        });
        console.log(`✅ Created: ${item.path}\\${item.name}`);
      }
    }
    
    console.log('🎉 File system initialized!');
  } catch (error) {
    console.error('❌ Setup error:', error.message);
  }
}

// ====================
// START SERVER
// ====================
const PORT = process.env.PORT || 5000;
app.listen(PORT,'0.0.0.0' ,() => {
  console.log(`Server running on port ${PORT}`);
  console.log('\n' + '='.repeat(50));
  console.log('🚀 WINDOWS DESKTOP BACKEND WITH PROPERTIES');
  console.log('='.repeat(50));
  console.log(`📡 http://localhost:${PORT}`);
  console.log(`📁 Uploads: ${uploadsDir}`);
  console.log(`📊 Max file size: 50MB`);
  console.log('='.repeat(50));
});