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

app.get("/confirmation", (req, res) => {
    const userData = req.session.submittedUser;

    if (!userData) {
        return res.redirect("/contact");
    }

    res.render("confirmation", { user: userData });
});

app.post("/submit", async (req, res) => {
    const first_name = req.body['first-name']?.trim();
    const last_name = req.body['last-name']?.trim();
    const email = req.body.email?.trim();
    const comments = req.body.comment?.trim(); // Matches your 'comments' column
    const mailing_list = req.body['mailing-list'] ? 1 : 0; // Checkbox to TinyInt
    const email_format = req.body.format; // Matches your 'email_format' column

    let errors = [];

    // Simple Server-Side Validation
    if (!first_name || !last_name) {
        errors.push("Names cannot be empty or just spaces.");
    }
    if (mailing_list && !email) {
        errors.push("Email is required for the mailing list.");
    }

    if (errors.length > 0) {
        return res.render("contact", { errors, formData: req.body });
    }

    try {
        const query = `
            INSERT INTO contacts (first_name, last_name, email, mailing_list, comments, email_format) 
            VALUES (?, ?, ?, ?, ?, ?)
        `;
        
        await pool.query(query, [first_name, last_name, email, mailing_list, comments, email_format]);
        req.session.submittedUser = {
            firstName: first_name,
            timestamp: new Date().toLocaleString()
        };
        
        res.redirect("/confirmation"); 
    } catch (err) {
        console.error("Database Error:", err);
        res.status(500).send("There was an error saving your information.");
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
