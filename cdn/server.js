// server.js, not in use
const express = require('express');
const multer = require('multer');
const fetch = require('node-fetch');
const FormData = require('form-data');
const app = express();
const upload = multer();

app.post('/api/upload', upload.single('file'), async (req, res) => {
    const form = new FormData();
    form.append('file', req.file.buffer, req.file.originalname);

    const response = await fetch('https://bucky.hackclub.com', {
        method: 'POST',
        body: form
    });

    if (!response.ok) return res.status(500).send('Bucky upload failed');
    const url = await response.text();
    res.send(url);
});

app.listen(3000, () => console.log('Server running on port 3000'));