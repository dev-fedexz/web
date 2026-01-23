const express = require('express');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const app = express();

const uploadDir = path.join(__dirname, 'lib', 'uploads');

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    
    const timestampId = Date.now(); 
    const finalExt = file.mimetype.startsWith('image/') ? '.jpeg' : '.mp4';
    cb(null, `${timestampId}${finalExt}`);
  }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 50 * 1024 * 1024 }
});

app.use(express.static(path.join(__dirname, 'lib')));

app.use('/uploads', express.static(uploadDir));

app.post('/upload-file', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No se subió ningún archivo' });
  
  const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
  
  res.json({ url: fileUrl });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'lib', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Web de Killua activo...`);
});
