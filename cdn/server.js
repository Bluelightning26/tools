import express from 'express';
import multer from 'multer';
import FormData from 'form-data';
import fetch from 'node-fetch';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();
const upload = multer();

// CDN-specific static file routes
router.get('/cdn/cdn.css', (req, res) => {
    try {
        const cssPath = path.join(__dirname, 'cdn.css');
        const cssContent = fs.readFileSync(cssPath, 'utf8');
        res.setHeader('Content-Type', 'text/css');
        res.send(cssContent);
    } catch (error) {
        res.status(404).send('CSS file not found');
    }
});

router.get('/cdn/cdn.js', (req, res) => {
    try {
        const jsPath = path.join(__dirname, 'cdn.js');
        const jsContent = fs.readFileSync(jsPath, 'utf8');
        res.setHeader('Content-Type', 'application/javascript');
        res.send(jsContent);
    } catch (error) {
        res.status(404).send('JS file not found');
    }
});

// Upload API endpoint
router.post('/api/upload', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file provided' });
        }

        const formData = new FormData();
        formData.append('file', req.file.buffer, {
            filename: req.file.originalname,
            contentType: req.file.mimetype
        });

        const buckyResponse = await fetch('https://bucky.hackclub.com/', {
            method: 'POST',
            body: formData,
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; tools.dhyans.xyz)',
            }
        });

        const responseText = await buckyResponse.text();

        if (!buckyResponse.ok) {
            throw new Error(`Bucky upload failed: ${buckyResponse.status}`);
        }

        if (!responseText.trim() || !responseText.trim().startsWith('http')) {
            throw new Error('Invalid response from upload service');
        }

        res.json({ url: responseText.trim() });

    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;