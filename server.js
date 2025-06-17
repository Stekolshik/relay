import express from 'express';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();
const app = express();

// Явный CORS
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  next();
});

app.get('/tmdb', async (req, res) => {
  try {
    const { url, ...params } = req.query;
    if (!url) {
      return res.status(400).json({ error: 'Missing required parameter "url"' });
    }

    const searchParams = new URLSearchParams(params);
    searchParams.set('api_key', process.env.TMDB_API_KEY);

    const fullUrl = `https://api.themoviedb.org/3${url}?${searchParams.toString()}`;
    console.log('Full URL:', fullUrl);

    const response = await fetch(fullUrl);
    
    // Проверка ошибки API TMDb
    if (!response.ok) {
      throw new Error(`TMDb API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error("TMDb proxy error:", err.message);
    res.status(500).json({ error: 'TMDb proxy failed', details: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🔁 TMDb relay listening on port ${PORT}`);
});
