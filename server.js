import express from 'express';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();
const app = express();

app.get('/tmdb', async (req, res) => {
  try {
    const { url } = req.query;
    const apiKey = process.env.TMDB_API_KEY;
    const fullUrl = `https://api.themoviedb.org/3${url}&api_key=${apiKey}`;

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
