import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";

dotenv.config();
const app = express();

// JSON body parser для POST/DELETE-запросов
app.use(express.json());

// CORS
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  next();
});

// ====== TMDB прокси ======
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

// ====== Прокси изображений ======
app.get("/image", async (req, res) => {
  try {
    const { path: imgPath } = req.query;
    if (!imgPath) return res.status(400).json({ error: "Missing image path" });

    const imageUrl = `https://image.tmdb.org/t/p${imgPath}`;
    console.log("Image URL:", imageUrl);

    const response = await fetch(imageUrl);
    if (!response.ok) {
      return res.status(response.status).end();
    }

    res.setHeader("Content-Type", response.headers.get("content-type"));
    response.body.pipe(res);
  } catch (error) {
    console.error("Ошибка проксирования изображения:", error.message);
    res.status(500).json({ error: "Image proxy failed", details: error.message });
  }
});

// ====== Хранение рейтингов ======
const RATINGS_FILE = path.join(process.cwd(), "ratings.json");

// Получить все оценки пользователя
app.get("/ratings", async (req, res) => {
  try {
    const { user_id } = req.query;
    if (!user_id) {
      return res.status(400).json({ error: "Missing user_id" });
    }

    let data = {};
    try {
      const raw = await fs.readFile(RATINGS_FILE, "utf-8");
      data = JSON.parse(raw);
    } catch {
      data = {};
    }

    res.json(data[user_id] || {});
  } catch (err) {
    console.error("Ошибка чтения рейтингов:", err.message);
    res.status(500).json({ error: "Ratings read failed", details: err.message });
  }
});

// Сохранить/обновить или удалить оценку
app.post("/ratings", async (req, res) => {
  try {
    const { user_id, movie_id, user_rating } = req.body;
    if (!user_id || !movie_id) {
      return res.status(400).json({ error: "Missing user_id or movie_id" });
    }

    let data = {};
    try {
      const raw = await fs.readFile(RATINGS_FILE, "utf-8");
      data = JSON.parse(raw);
    } catch {
      data = {};
    }

    if (!data[user_id]) data[user_id] = {};

    if (typeof user_rating === "number") {
      // сохранить рейтинг
      data[user_id][movie_id] = { user_rating };
    } else {
      // удалить рейтинг
      delete data[user_id][movie_id];
    }

    await fs.writeFile(RATINGS_FILE, JSON.stringify(data, null, 2));
    res.json({ success: true });
  } catch (err) {
    console.error("Ошибка записи рейтингов:", err.message);
    res.status(500).json({ error: "Ratings write failed", details: err.message });
  }
});

// Удалить оценку через DELETE
app.delete("/ratings", async (req, res) => {
  try {
    const { user_id, movie_id } = req.body;
    if (!user_id || !movie_id) {
      return res.status(400).json({ error: "Missing user_id or movie_id" });
    }

    let data = {};
    try {
      const raw = await fs.readFile(RATINGS_FILE, "utf-8");
      data = JSON.parse(raw);
    } catch {
      data = {};
    }

    if (data[user_id] && data[user_id][movie_id]) {
      delete data[user_id][movie_id];
      await fs.writeFile(RATINGS_FILE, JSON.stringify(data, null, 2));
    }

    res.json({ success: true });
  } catch (err) {
    console.error("Ошибка удаления рейтинга:", err.message);
    res.status(500).json({ error: "Ratings delete failed", details: err.message });
  }
});

// ====== Генерация нового user_id ======
app.get("/new-user", (req, res) => {
  const id = crypto.randomUUID();
  res.json({ user_id: id });
});

// ====== Запуск ======
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🔁 TMDb proxy server + ratings запущен на порту ${PORT}`);
});
