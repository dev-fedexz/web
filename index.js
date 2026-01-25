// ✿ Código creado por the-xyzz*/

const express = require('express');
const path = require('path');
const multer = require('multer');
const app = express();

let storageDB = {}; 

const storage = multer.memoryStorage();
const upload = multer({ 
    storage: storage,
    limits: { fileSize: 4 * 1024 * 1024 }
});

app.use(express.static(path.join(__dirname, 'lib')));

app.get('/uploads/:filename', (req, res) => {
    const file = storageDB[req.params.filename];
    if (file) {
        res.set('Content-Type', file.mime);
        return res.send(file.buffer);
    } 
    res.status(404).send('Archivo no encontrado (Vercel reinició la memoria)');
});

app.post('/upload-file', upload.single('file'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file' });

    const fileName = `${Date.now()}${path.extname(req.file.originalname) || '.jpeg'}`;

    storageDB[fileName] = {
        buffer: req.file.buffer,
        mime: req.file.mimetype
    };

    const fileUrl = `https://${req.get('host')}/uploads/${fileName}`;
    res.json({ url: fileUrl });
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'lib', 'index.html'));
});

module.exports = app;
