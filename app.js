import express from "express";
import path from "path";
import mysql from "mysql2/promise";
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import 'dotenv/config';
import session from 'express-session';


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

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true
}));

app.get('/login', (req, res) => {
    res.render('login', { error: null });
});

app.get("/portfolio", (req, res) => {
  res.render("portfolio");
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    if (username === process.env.ADMIN_USER && password === process.env.ADMIN_PASS) {
        req.session.authenticated = true;
        res.redirect('/admin');
    } else {
        res.render('login', { error: 'Invalid credentials' });
    }
});

app.get("/", (req, res) => {
    res.render("home");
});

app.get("/contact", (req, res) => {
  res.render("contact");
});

app.post("/submit", async (req, res) => {
    let { "first-name": fname, "last-name": lname, email, meet, other, "mailing-list": mailingList, format } = req.body;
    
    let errors = [];
    const validOptions = ['meetup', 'job-fair', 'other'];

    fname = fname?.trim();
    lname = lname?.trim();
    if (!fname || !lname) errors.push("First and last name are required.");

    if (!validOptions.includes(meet)) errors.push("Please select a valid 'How we met' option.");

    if (mailingList && !['html', 'text'].includes(format)) {
        errors.push("Please select a valid email format for the mailing list.");
    }

    if (errors.length > 0) {
        return res.render("contact", { errors, formData: req.body });
    }
    
    const fullName = `${fname} ${lname}`;
    const metVia = (meet === 'other') ? other : meet;

    try {
        const sql = 'INSERT INTO contacts (name, email, message, comments, email_format) VALUES (?, ?, ?, ?, ?)';
        await pool.execute(sql, [fullName, email, metVia, comments, format]);

        res.render("confirmation", { 
            user: { firstName: fname, timestamp: new Date().toLocaleString(), email, howWeMet: metVia } 
        });
    } catch (err) {
        console.error(err);
        res.status(500).send("Error saving data.");
    }
});

app.get('/admin', async (req, res) => {
    if (!req.session.authenticated) {
        return res.redirect('/login');
    }
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
