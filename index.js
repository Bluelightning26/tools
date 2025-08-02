import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cdnRouter from './cdn/server.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();



//CDN


// Mount CDN routes
app.use('/', cdnRouter);

// css
app.get('/cdn/styles.css', (req, res) => {
    res.setHeader('Content-Type', 'text/css');
    res.sendFile(path.join(__dirname, 'styles.css'));
});

// html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/cdn/', (req, res) => {
    res.sendFile(path.join(__dirname, 'cdn', 'index.html'));
});

// Serve static files
app.use(express.static(__dirname));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log('Happy developing ✨');
});