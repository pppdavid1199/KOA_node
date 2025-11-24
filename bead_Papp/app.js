const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const bcrypt = require("bcrypt");
const session = require("express-session");
const path = require("path");
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    secret: "supersecret",
    resave: false,
    saveUninitialized: false,
  })
);

const db = new sqlite3.Database("./movies.db");

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE,
    password_hash TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS movies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    year INTEGER,
    genre TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS watchlist (
    user_id INTEGER,
    movie_id INTEGER,
    PRIMARY KEY(user_id, movie_id)
  )`);

  db.get(`SELECT COUNT(*) AS c FROM movies`, (err, row) => {
    if (row.c === 0) {
      const ins = db.prepare(`INSERT INTO movies(title, year, genre) VALUES (?, ?, ?)`);
      ins.run("The Matrix", 1999, "Sci-Fi");
      ins.run("Inception", 2010, "Sci-Fi");
      ins.run("Interstellar", 2014, "Sci-Fi");
      ins.run("The Godfather", 1972, "Crime");
      ins.run("Pulp Fiction", 1994, "Crime");
      ins.finalize();
    }
  });
});

function requireLogin(req, res, next) {
  if (!req.session.userId) return res.status(401).json({ error: "Not logged in" });
  next();
}

app.post("/api/register", async (req, res) => {
  const { email, password } = req.body;
  const password_hash = await bcrypt.hash(password, 10);

  db.run(
    `INSERT INTO users(email, password_hash) VALUES (?, ?)`,
    [email, password_hash],
    function (err) {
      if (err) return res.status(400).json({ error: "Email már létezik" });
      req.session.userId = this.lastID;
      res.json({ message: "Sikeres regisztráció" });
    }
  );
});

app.post("/api/login", (req, res) => {
  const { email, password } = req.body;

  db.get(`SELECT * FROM users WHERE email = ?`, [email], async (err, user) => {
    if (!user) return res.status(400).json({ error: "Hibás adatok" });

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return res.status(400).json({ error: "Hibás adatok" });

    req.session.userId = user.id;
    res.json({ message: "Sikeres bejelentkezés" });
  });
});

app.post("/api/logout", (req, res) => {
  req.session.destroy(() => res.json({ message: "Kijelentkezve" }));
});

app.get("/api/check", (req, res) => {
  if (req.session.userId) return res.json({ loggedIn: true });
  res.status(401).json({ loggedIn: false });
});

app.get("/api/movies", (req, res) => {
  db.all(`SELECT * FROM movies`, [], (err, rows) => res.json(rows));
});

app.post("/api/watchlist", requireLogin, (req, res) => {
  const userId = req.session.userId;
  const { movie_id } = req.body;

  db.run(
    `INSERT OR IGNORE INTO watchlist(user_id, movie_id) VALUES (?, ?)`,
    [userId, movie_id],
    (err) => {
      if (err) return res.status(500).json({ error: "Hiba a hozzáadásnál" });
      res.json({ message: "Hozzáadva a watchlisthez" });
    }
  );
});

app.get("/api/watchlist", requireLogin, (req, res) => {
  const userId = req.session.userId;

  db.all(
    `SELECT movies.* FROM movies
     JOIN watchlist ON movies.id = watchlist.movie_id
     WHERE watchlist.user_id = ?`,
    [userId],
    (err, rows) => res.json(rows)
  );
});

app.delete("/api/watchlist/:movieId", requireLogin, (req, res) => {
  const userId = req.session.userId;
  const movieId = req.params.movieId;

  db.run(
    `DELETE FROM watchlist WHERE user_id = ? AND movie_id = ?`,
    [userId, movieId],
    function (err) {
      if (err) return res.status(500).json({ error: "Hiba törlés közben" });
      if (this.changes === 0) return res.status(404).json({ error: "Nincs ilyen film a listában" });

      res.json({ message: "Törölve" });
    }
  );
});

app.use(express.static(path.join(__dirname, "public")));

app.listen(3000, () => console.log("Server running on http://localhost:3000"));
