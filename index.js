const express = require('express');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const os = require('os');
const app = express();

const uploadDir = path.join(os.tmpdir(), 'uploads');
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

const upload = multer({ storage: storage });

app.use(express.static(path.join(__dirname, 'lib')));

app.get('/uploads/:filename', (req, res) => {
    const filePath = path.join(uploadDir, req.params.filename);
    if (fs.existsSync(filePath)) {
        res.sendFile(filePath);
    } else {
        res.status(404).send('Not Found');
    }
});

app.post('/upload-file', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  
  const fileUrl = `https://${req.get('host')}/uploads/${req.file.filename}`;
  res.json({ url: fileUrl });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'lib', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`API Killua running`);
});
