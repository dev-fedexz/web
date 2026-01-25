// ✿ Código creado por the-xyzz*/

const express = require('express');
const path = require('path');
const multer = require('multer');
const { Redis } = require('@upstash/redis');
const app = express();

const redis = new Redis({
  url: 'TU_UPSTASH_REDIS_REST_URL',
  token: 'TU_UPSTASH_REDIS_REST_TOKEN',
});

const storage = multer.memoryStorage();
const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }
});

app.use(express.static(path.join(__dirname, 'lib')));

app.get('/uploads/:filename', async (req, res) => {
    
    const file = await redis.get(req.params.filename);
    
    if (file) {
        const buffer = Buffer.from(file.buffer, 'base64');
        res.set('Content-Type', file.mime);
        res.send(buffer);
    } else {
        res.status(404).send('Archivo no encontrado o expirado (Límite 1 semana)');
    }
});

app.post('/upload-file', upload.single('file'), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file' });

    const timestampId = Date.now();
    const ext = path.extname(req.file.originalname) || '.bin';
    const fileName = `${timestampId}${ext}`;

    const fileData = {
        buffer: req.file.buffer.toString('base64'),
        mime: req.file.mimetype
    };
    
    await redis.set(fileName, fileData, { ex: 604800 });

    const fileUrl = `https://${req.get('host')}/uploads/${fileName}`;
    res.json({ url: fileUrl });
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'lib', 'index.html'));
});

module.exports = app;
