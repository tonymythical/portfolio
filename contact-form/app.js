import express from "express";
import path from "path";

const app = express();
const PORT = 3009;
const mysql = require('mysql2');
const pool = mysql.createPool({
  host: 'localhost',
  user: 'your_username',
  password: 'your_password',
  database: 'portfolio_db'
}).promise();

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

app.post("/submit", (req, res) => {
  const newEntry = {
    firstName: req.body["first-name"],
    lastName: req.body["last-name"],
    email: req.body.email,
    linkedIn: req.body.linkedin,
    howWeMet: req.body.meet,
    otherSpecify: req.body.other,
    mailingList: req.body["mailing-list"] === "on",
    format: req.body.format || "N/A",
    timestamp: new Date().toLocaleString()
  };

  guestbookUsers.push(newEntry);

  res.render("confirmation", { user: newEntry });
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
    const [rows] = await pool.query('SELECT * FROM contacts ORDER BY created_at DESC');
    
    res.render('admin', { contacts: rows });
});

app.listen(PORT, () => {
  console.log(`Server: http://localhost:${PORT}`);
});
