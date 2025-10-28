// This is the final, combined server file for Render.
// It uses Express to serve both the static index.html file and the API routes.
import express from 'express';
import axios from 'axios';
import path from 'path';
import { fileURLToPath } from 'url';


// Load environment variables from .env file


// This is required boilerplate for serving static files in Node.js ES Modules.
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- Initialize the Application ---
const app = express();
const PORT = process.env.PORT || 10000; // Render provides the PORT variable

// --- Configure Middleware ---
app.use(express.json());

// --- Securely Load the API Keys ---
const OTX_API_KEY = process.env.OTX_API_KEY || '';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const MAPTILER_KEY = process.env.MAPTILER_KEY || '';

// --- API ROUTES ---
// All API calls will now be prefixed with /api
const apiRouter = express.Router();

// -- OTX SCAN ROUTE --
apiRouter.post('/scan', async (req, res) => {
    const { ioc, apiType } = req.body;
    if (!ioc || !apiType) return res.status(400).json({ error: 'Indicator and type are required fields.' });
    if (!OTX_API_KEY) return res.status(500).json({ error: 'Server configuration error for OTX.' });

    const apiUrl = `https://otx.alienvault.com/api/v1/indicators/${apiType}/${encodeURIComponent(ioc)}/general`;
    try {
        const otxResponse = await axios.get(apiUrl, { headers: { 'X-OTX-API-KEY': OTX_API_KEY } });
        res.json(otxResponse.data);
    } catch (error) {
        handleAxiosError(error, res);
    }
});

// -- CLIENT CONFIG (safe to expose minimal non-secret config) --
// Returns values that are OK to be sent to the browser. Do NOT expose
// secrets like private API keys you don't want in clients.
apiRouter.get('/config', (req, res) => {
    res.json({
        maptilerKey: MAPTILER_KEY || ''
    });
});

// -- GEMINI TEXT ANALYSIS ROUTE --
apiRouter.post('/text', async (req, res) => {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ error: 'Prompt is required.' });
    if (!GEMINI_API_KEY) return res.status(500).json({ error: 'Server configuration error for AI Analysis.' });

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;
    const payload = { contents: [{ role: "user", parts: [{ text: prompt }] }] };

    try {
        const geminiResponse = await axios.post(apiUrl, payload, { headers: { 'Content-Type': 'application/json' } });
        res.json(geminiResponse.data);
    } catch (error) {
        handleAxiosError(error, res);
    }
});

// Mount the API router to the /api path
app.use('/api', apiRouter);


// --- STATIC FILE SERVING ---
// This tells Express to serve your `index.html` from the root of your project.
// The `path.join` call correctly finds the root directory from within the /api folder.
app.use(express.static(path.join(__dirname, '..')));

// This is the fallback for single-page applications. It ensures that if a user
// refreshes the page, they are still served the index.html file.
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'index.html'));
});


// --- Centralized Error Handler ---
function handleAxiosError(error, res) {
    if (error.response) {
        return res.status(error.response.status).json(error.response.data);
    }
    return res.status(500).json({ error: 'Internal Server Error' });
}

// --- Start the Server ---
app.listen(PORT, () => {
    console.log(`Angel's Eye server is running on port ${PORT}`);
});
