import express from "express";
import path from "path";
import mysql from "mysql2/promise";

const app = express();
const PORT = 3010;
const pool = mysql.createPool({
  host: 'localhost',
  user: 'Test',
  password: 'your_password',
  database: 'portfolio_db'
});

app.set("view engine", "ejs");

app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));

const guestbookUsers = [];

app.get("/", (req, res) => {
  res.render("home");
});

app.get("/contact", (req, res) => {
  res.render("contact");
});

app.post("/submit", async (req, res) => {
  const { "first-name": firstName, "last-name": lastName, email, meet: howWeMet } = req.body;

  try {
    const query = 'INSERT INTO contacts (name, email, message) VALUES (?, ?, ?)';
    const fullName = `${firstName} ${lastName}`;
    await pool.execute(query, [fullName, email, howWeMet]);

    res.render("confirmation", { user: { firstName, lastName } });
  } catch (err) {
    console.error(err);
    res.status(500).send("Database Error");
  }
});

app.post('/contact', async (req, res) => {
    const { name, email, message } = req.body;
    
    try {
        const query = 'INSERT INTO contacts (name, email, message) VALUES (?, ?, ?)';
        await pool.execute(query, [name, email, message]);
        
        res.render('confirmation', { name });
    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
});

app.get('/admin', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM contacts ORDER BY created_at DESC');
        res.render('admin', { users: rows }); 
    } catch (err) {
        console.error(err);
        res.status(500).send("Error loading admin page");
    }
});

app.listen(PORT, () => {
  console.log(`Server: http://localhost:${PORT}`);
});
