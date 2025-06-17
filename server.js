import express from 'express';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import cors from 'cors'; 

dotenv.config();
const app = express();


app.use(cors());

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
    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'TMDb proxy failed', details: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🔁 TMDb relay listening on port ${PORT}`);
});
