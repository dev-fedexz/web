const express = require('express');
const multer = require('multer');
const fetch = require('node-fetch');
const app = express();

const GITHUB_TOKEN = "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";
const REPO_OWNER = "dev-fedexz";
const REPO_NAME = "web";
const BRANCH = "main";

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

app.use(express.static('lib'));

app.post('/upload-file', upload.single('file'), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file' });

    const timestampId = Date.now();
    let ext = '';
    if (req.file.mimetype.startsWith('image/')) ext = '.jpeg';
    else if (req.file.mimetype.startsWith('video/')) ext = '.mp4';
    else if (req.file.mimetype.startsWith('audio/')) ext = '.mp3';
    else ext = '.' + req.file.originalname.split('.').pop();

    const fileName = `${timestampId}${ext}`;
    const filePath = `uploads/${fileName}`;

    const contentBase64 = req.file.buffer.toString('base64');

    try {
        const response = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${filePath}`, {
            method: 'PUT',
            headers: {
                'Authorization': `token ${GITHUB_TOKEN}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message: `Upload: ${fileName}`,
                content: contentBase64,
                branch: BRANCH
            })
        });

        if (!response.ok) throw new Error('Error al subir a GitHub');

        const fileUrl = `https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/${BRANCH}/${filePath}`;
        
        res.json({ url: fileUrl });

    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Error al subir a GitHub' });
    }
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'lib', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`API GitHub Uploader activa`));
