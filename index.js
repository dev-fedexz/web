// ✿ Código creado por the-xyzz*/

const express = require('express');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const app = express();

const DB_PATH = path.join(__dirname, 'src', 'database.json');
const UPLOADS_DIR = path.join(__dirname, 'uploads');

if (!fs.existsSync(path.join(__dirname, 'src'))) fs.mkdirSync(path.join(__dirname, 'src'));
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR);
if (!fs.existsSync(DB_PATH)) fs.writeFileSync(DB_PATH, JSON.stringify({}));

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, UPLOADS_DIR);
    },
    filename: (req, file, cb) => {
        const timestampId = Date.now();
        let ext = path.extname(file.originalname);
        
        if (file.mimetype.startsWith('image/')) ext = '.jpeg';
        else if (file.mimetype.startsWith('video/')) ext = '.mp4';
        else if (file.mimetype.startsWith('audio/')) ext = '.mp3';
        
        cb(null, `${timestampId}${ext}`);
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 20 * 1024 * 1024 } 
});

app.use(express.static(path.join(__dirname, 'lib')));

app.use('/uploads', express.static(UPLOADS_DIR));

const getDB = () => JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
const saveDB = (data) => fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));

app.post('/upload-file', upload.single('file'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file' });

    const fileName = req.file.filename;
    const db = getDB();

    db[fileName] = {
        originalName: req.file.originalname,
        mime: req.file.mimetype,
        date: Date.now(),
        path: `/uploads/${fileName}`
    };
    saveDB(db);

    const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${fileName}`;
    res.json({ url: fileUrl });
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'lib', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`✿ Servidor de Killua activo con DB persistente.`);
});
