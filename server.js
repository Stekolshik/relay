import express from 'express';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();
const app = express();

app.get('/tmdb', async (req, res) => {
  try {
    const { url } = req.query;
    if (!url) {
      return res.status(400).json({ error: 'Missing required parameter "url"' });
    }
    
    const apiKey = process.env.TMDB_API_KEY;
    const separator = url.includes('?') ? '&' : '?';
    const fullUrl = `https://api.themoviedb.org/3${url}${separator}api_key=${apiKey}`;

    const response = await fetch(fullUrl);
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'TMDb proxy failed', details: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🔁 TMDb relay listening on port ${PORT}`);
});
