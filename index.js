// ✿ Código creado por the-xyzz*/

const express = require('express');
const path = require('path');
const multer = require('multer');
const app = express();


let storageDB = {}; 

const storage = multer.memoryStorage();
const upload = multer({ 
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }
});

app.use(express.static(path.join(__dirname, 'lib')));

app.get('/uploads/:filename', (req, res) => {
    const file = storageDB[req.params.filename];
    if (file) {
        res.set('Content-Type', file.mime);
        res.send(file.buffer);
    } else {
        res.status(404).send('Archivo no encontrado o expirado por inactividad');
    }
});

app.post('/upload-file', upload.single('file'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file' });

    const timestampId = Date.now();
    let ext = path.extname(req.file.originalname) || '.bin';

    if (req.file.mimetype.startsWith('image/')) ext = '.jpeg';
    else if (req.file.mimetype.startsWith('video/')) ext = '.mp4';
    else if (req.file.mimetype.startsWith('audio/')) ext = '.mp3';

    const fileName = `${timestampId}${ext}`;

    storageDB[fileName] = {
        buffer: req.file.buffer,
        mime: req.file.mimetype,
        date: Date.now()
    };

    const fileUrl = `https://${req.get('host')}/uploads/${fileName}`;
    res.json({ url: fileUrl });
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'lib', 'index.html'));
});

module.exports = app; 

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`✿ Servidor activo.`);
});
