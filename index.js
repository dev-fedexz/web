const express = require('express');
const path = require('path');
const multer = require('multer');
const axios = require('axios');
const app = express();

const GITHUB_TOKEN = "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"; 
const REPO_OWNER = "dev-fedexz";
const REPO_NAME = "web";
const BRANCH = "main";

const storage = multer.memoryStorage();
const upload = multer({ storage: storage, limits: { fileSize: 25 * 1024 * 1024 } });

app.use(express.static(path.join(__dirname, 'lib')));

app.get('/uploads/:filename', async (req, res) => {
    const { filename } = req.params;
    const githubRawUrl = `https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/${BRANCH}/uploads/${filename}`;
    
    try {
        const response = await axios.get(githubRawUrl, { responseType: 'arraybuffer' });
        const contentType = response.headers['content-type'] || 'application/octet-stream';
        res.setHeader('Content-Type', contentType);
        res.send(response.data);
    } catch (e) {
        res.status(404).send('Archivo no encontrado');
    }
});

app.post('/upload-file', upload.single('file'), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file' });

    const timestampId = Date.now();
    let ext = path.extname(req.file.originalname) || '.jpeg';
    if (req.file.mimetype.startsWith('image/')) ext = '.jpeg';
    else if (req.file.mimetype.startsWith('video/')) ext = '.mp4';
    else if (req.file.mimetype.startsWith('audio/')) ext = '.mp3';

    const fileName = `${timestampId}${ext}`;
    const contentBase64 = req.file.buffer.toString('base64');

    try {
        await axios.put(
            `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/uploads/${fileName}`,
            {
                message: `Upload: ${fileName}`,
                content: contentBase64,
                branch: BRANCH
            },
            {
                headers: { 'Authorization': `token ${GITHUB_TOKEN}` }
            }
        );

        const fileUrl = `https://${req.get('host')}/uploads/${fileName}`;
        res.json({ url: fileUrl });

    } catch (e) {
        console.error(e.response ? e.response.data : e.message);
        res.status(500).json({ error: 'Error al subir a GitHub' });
    }
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'lib', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Server Ready'));
