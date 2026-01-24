// ✿ Código creado por the-xyzz*/

const express = require('express');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const axios = require('axios');
const FormData = require('form-data');
const cheerio = require('cheerio');
const { JSDOM } = require('jsdom');
const { GoogleGenAI } = require('@google/generative-ai');

const app = express();
const router = express.Router();

app.use(express.json());
app.use(express.static(path.join(__dirname, 'lib')));

let storageDB = {}; 
const upload = multer({ 
    storage: multer.memoryStorage(), 
    limits: { fileSize: 25 * 1024 * 1024 } 
});

app.get('/api/list', (req, res) => {
    try {
        const apisPath = path.join(process.cwd(), 'src', 'apis.json');
        if (fs.existsSync(apisPath)) {
            const data = fs.readFileSync(apisPath, 'utf8');
            res.setHeader('Content-Type', 'application/json');
            res.send(data);
        } else {
            res.status(404).json({ error: "Archivo apis.json no encontrado" });
        }
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

router.get('/ai/gemini', async (req, res) => {
    const { text, apikey } = req.query;
    if (!text || !apikey) return res.status(400).json({ error: "Faltan parámetros: text y apikey" });
    try {
        const genAI = new GoogleGenAI(apikey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent(text);
        res.json({ status: true, result: result.response.text() });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/ai/chatgpt', async (req, res) => {
    const { text } = req.query;
    if (!text) return res.status(400).json({ error: "Falta el parámetro text" });
    try {
        const { data } = await axios.post("https://stablediffusion.fr/gpt3/predict", { prompt: text });
        res.json({ status: true, result: data });
    } catch (e) { res.status(500).json({ error: "Error en ChatGPT" }); }
});

router.get('/tools/ezremove', async (req, res) => {
    const { imgurl } = req.query;
    if (!imgurl) return res.status(400).json({ error: "Falta imgurl" });
    try {
        const media = await axios.get(imgurl, { responseType: 'arraybuffer' });
        const form = new FormData();
        form.append("image", media.data, { filename: "image.png" });
        const resp = await axios.post("https://api2.pixelcut.app/image/matte/v1", form, {
            headers: { ...form.getHeaders() }, 
            responseType: 'arraybuffer'
        });
        res.set('Content-Type', 'image/png').send(resp.data);
    } catch (e) { res.status(500).json({ error: "Error al remover fondo" }); }
});

router.get('/downloader/tiktok', async (req, res) => {
    const { url } = req.query;
    if (!url) return res.status(400).json({ error: "Falta la url de TikTok" });
    try {
        const form = new FormData();
        form.append("url", url);
        const { data } = await axios.post('https://tikwm.com/api/', form, { headers: form.getHeaders() });
        res.json({ status: true, result: data.data });
    } catch (e) { res.status(500).json({ error: "Error en TikTok Downloader" }); }
});

router.get('/tools/githubstalk', async (req, res) => {
    const { user } = req.query;
    if (!user) return res.status(400).json({ error: "Falta el usuario" });
    try {
        const { data } = await axios.get(`https://api.github.com/users/${user}`);
        res.json({ status: true, result: data });
    } catch (e) { res.status(500).json({ error: "Usuario no encontrado" }); }
});

router.get('/maker/brat', async (req, res) => {
    const { text } = req.query;
    if (!text) return res.status(400).json({ error: "Falta text" });
    try {
        const { data } = await axios.get(`https://raolbyte-brat.hf.space/maker/brat?text=${encodeURIComponent(text)}`);
        res.json({ status: true, result: data.image_url });
    } catch (e) { res.status(500).json({ error: "Error creando Brat" }); }
});

app.use('/api', router);

app.post('/upload-file', upload.single('file'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No se subió ningún archivo' });
    const fileName = `${Date.now()}.${req.file.mimetype.split('/')[1]}`;
    storageDB[fileName] = { 
        buffer: req.file.buffer, 
        mime: req.file.mimetype 
    };
    res.json({ url: `https://${req.get('host')}/uploads/${fileName}` });
});

app.get('/uploads/:filename', (req, res) => {
    const file = storageDB[req.params.filename];
    if (file) {
        res.set('Content-Type', file.mime);
        return res.send(file.buffer);
    }
    res.status(404).send('Archivo no encontrado');
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'lib', 'index.html'));
});

module.exports = app;
