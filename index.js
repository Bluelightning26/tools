import express from 'express';
import multer from 'multer';
import FormData from 'form-data';
import fetch from 'node-fetch';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const upload = multer();

// API routes BEFORE static middleware
app.post('/api/upload', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file provided' });
        }

// cdn routes to handle relative path issues
        app.get('/cdn/styles.css', (req, res) => {
            res.sendFile(path.join(__dirname, 'styles.css'));
        });

        app.get('/cdn/cdn.css', (req, res) => {
            res.sendFile(path.join(__dirname, 'cdn', 'cdn.css'));
        });

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
        console.log('Bucky response status:', buckyResponse.status);
        console.log('Bucky response:', responseText.substring(0, 200));

        if (!buckyResponse.ok) {
            throw new Error(`Bucky upload failed: ${buckyResponse.status} - Response: ${responseText.substring(0, 100)}`);
        }

        // Check if response looks like HTML (error page)
        if (responseText.trim().toLowerCase().startsWith('<!doctype') ||
            responseText.trim().toLowerCase().startsWith('<html') ||
            responseText.includes('The page c')) {
            throw new Error('Bucky returned HTML error page instead of URL');
        }

        // Check if response is a valid URL
        if (!responseText.trim() || !responseText.trim().startsWith('http')) {
            throw new Error('Bucky returned invalid response format');
        }

        res.json({ url: responseText.trim() });

    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Root route to serve html files
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});
app.get('/cdn/', (req, res) => {
    res.sendFile(path.join(__dirname, 'cdn', 'index.html'));
});

// Serve static files AFTER API routes
app.use(express.static(__dirname));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log('Happy developing ✨');
});