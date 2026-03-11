import express from "express";
import path from "path";
import mysql from "mysql2/promise";
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import 'dotenv/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT ||  3010;
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10
});

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.render("home");
});

app.get("/contact", (req, res) => {
  res.render("contact");
});

app.post("/submit", async (req, res) => {
    const { "first-name": fname, "last-name": lname, email, meet, other } = req.body;
    const fullName = `${fname} ${lname}`;
    const finalMessage = other || meet; // Use 'other' if they typed it, otherwise 'meet'

    try {
        const sql = 'INSERT INTO contacts (name, email, message) VALUES (?, ?, ?)';
        await pool.execute(sql, [fullName, email, finalMessage]);

        res.render("confirmation", { 
            user: { 
                firstName: fname, 
                timestamp: new Date().toLocaleString(), 
                email: email, 
                howWeMet: meet,
                otherSpecify: other 
            } 
        });
    } catch (err) {
        console.error("Database Error:", err);
        res.status(500).send("Could not save to guestbook.");
    }
});

app.get('/admin', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM contacts ORDER BY created_at DESC');
        res.render('admin', { users: rows }); 
    } catch (err) {
        console.error(err);
        res.status(500).send("Database Error");
    }
});

app.listen(PORT, () => {
  console.log(`Server: http://localhost:${PORT}`);
});
