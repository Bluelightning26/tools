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

        const formData = new FormData();
        formData.append('file', req.file.buffer, {
            filename: req.file.originalname,
            contentType: req.file.mimetype
        });

        const buckyResponse = await fetch('https://bucky.hackclub.com/', {
            method: 'POST',
            body: formData
        });

        if (!buckyResponse.ok) {
            const errorText = await buckyResponse.text();
            console.error('Bucky error response:', errorText);
            throw new Error(`Bucky upload failed: ${buckyResponse.status} - ${errorText.substring(0, 100)}`);
        }

        const responseText = await buckyResponse.text();

        // Check if response is a valid URL
        if (!responseText.trim() || !responseText.trim().startsWith('http')) {
            console.error('Invalid Bucky response:', responseText.substring(0, 200));
            throw new Error('Bucky returned invalid response');
        }

        res.json({ url: responseText.trim() });

    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Serve static files AFTER API routes
app.use(express.static(__dirname));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log('Happy developing ✨');
});