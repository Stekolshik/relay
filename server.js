import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();
const app = express();

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  next();
});

app.get("/tmdb", async (req, res) => {
  try {
    const { url, ...params } = req.query;
    if (!url) {
      return res.status(400).json({ error: 'Missing required parameter "url"' });
    }

    const searchParams = new URLSearchParams(params);
    searchParams.set("api_key", process.env.TMDB_API_KEY);

    const fullUrl = `https://api.themoviedb.org/3${url}?${searchParams.toString()}`;
    console.log("Full URL:", fullUrl);

    const response = await fetch(fullUrl);
    if (!response.ok) throw new Error(`TMDb API error: ${response.status}`);

    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error("Ошибка TMDb-прокси:", err.message);
    res.status(500).json({ error: "TMDb proxy failed", details: err.message });
  }
});

app.get("/image", async (req, res) => {
  try {
    const { path } = req.query;
    if (!path) return res.status(400).json({ error: "Missing image path" });

    const imageUrl = `https://image.tmdb.org/t/p/w500${path}`;
    const response = await fetch(imageUrl);

    if (!response.ok) throw new Error(`TMDb image error: ${response.status}`);

    const buffer = await response.arrayBuffer();
    res.setHeader("Content-Type", response.headers.get("Content-Type"));
    res.send(Buffer.from(buffer));
  } catch (error) {
    console.error("Ошибка проксирования изображения:", error.message);
    res.status(500).json({ error: "Image proxy failed", details: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🔁 TMDb proxy server запущен на порту ${PORT}`);
});
