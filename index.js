// ✿ Código creado por the-xyzz*/

const express = require('express');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const axios = require('axios');
const FormData = require('form-data');
const { JSDOM } = require('jsdom');
const cheerio = require('cheerio');
const { GoogleGenAI } = require('@google/generative-ai');

const app = express();
const router = express.Router();

let storageDB = {}; 

const storage = multer.memoryStorage();
const upload = multer({ 
    storage: storage,
    limits: { fileSize: 50 * 1024 * 1024 } // Aumentado a 50MB para videos
});

app.use(express.json());
app.use(express.static(path.join(__dirname, 'lib')));

// --- SISTEMA DE ALMACENAMIENTO TEMPORAL ---
app.get('/uploads/:filename', (req, res) => {
    const file = storageDB[req.params.filename];
    if (file) {
        res.set('Content-Type', file.mime);
        res.send(file.buffer);
    } else {
        res.status(404).send('Archivo no encontrado');
    }
});

app.post('/upload-file', upload.single('file'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file' });

    const timestampId = Date.now();
    let ext = req.file.mimetype.startsWith('image/') ? '.jpeg' : 
              req.file.mimetype.startsWith('video/') ? '.mp4' : 
              req.file.mimetype.startsWith('audio/') ? '.mp3' : 
              '.' + req.file.originalname.split('.').pop();

    const fileName = `${timestampId}${ext}`;
    storageDB[fileName] = {
        buffer: req.file.buffer,
        mime: req.file.mimetype,
        date: Date.now()
    };

    const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${fileName}`;
    res.json({ url: fileUrl });
});

// --- RUTA PARA EL LISTADO DE APIS (Aptoides) ---
app.get('/api/list', (req, res) => {
    const apisPath = path.join(__dirname, 'src', 'apis.json');
    if (fs.existsSync(apisPath)) {
        res.json(JSON.parse(fs.readFileSync(apisPath, 'utf8')));
    } else {
        res.status(404).json({ error: "apis.json no encontrado" });
    }
});

// --------------------- ENDPOINTS DE IA & TOOLS ---------------------

// Gemini AI
router.get('/ai/gemini', async (req, res) => {
    const { text, apikey } = req.query;
    if (!text || !apikey) return res.status(400).json({ error: "Faltan parámetros" });
    try {
        const genAI = new GoogleGenAI(apikey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent(text);
        res.json({ status: true, result: result.response.text() });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// Eliminar Fondo (Pixelcut API)
router.get('/tools/ezremove', async (req, res) => {
    const { imgurl } = req.query;
    if (!imgurl) return res.status(400).json({ error: "Falta imgurl" });
    try {
        const img = await axios.get(imgurl, { responseType: 'arraybuffer' });
        const form = new FormData();
        form.append("image", img.data, { filename: "image.png" });
        const resp = await axios.post("https://api2.pixelcut.app/image/matte/v1", form, {
            headers: { ...form.getHeaders() },
            responseType: 'arraybuffer'
        });
        res.set('Content-Type', 'image/png');
        res.send(resp.data);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// TikTok Downloader
router.get('/downloader/tiktok', async (req, res) => {
    const { url } = req.query;
    if (!url) return res.status(400).json({ error: "Falta url" });
    try {
        const form = new FormData();
        form.append("url", url);
        const { data } = await axios.post('https://tikwm.com/api/', form, { headers: form.getHeaders() });
        res.json({ status: true, result: data.data });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// Registrar todas las rutas bajo /api
app.use('/api', router);

// --- SERVIR EL FRONTEND ---
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'lib', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`
    ✿ Killua Web Server Activo ✿
    > Local: http://localhost:${PORT}
    > APIs y Uploader listos.
    `);
});
