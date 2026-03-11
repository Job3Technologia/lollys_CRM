const db = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { sendVerificationCode } = require('../utils/mailer');

const JWT_SECRET = process.env.JWT_SECRET || 'lollys_secret_key';

// Generate random verification code
const generateCode = () => Math.floor(100000 + Math.random() * 900000).toString();

// Human Verification Helper
const verifyCaptcha = async (token) => {
    // In production, verify with Cloudflare Turnstile or Google reCAPTCHA
    // const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { ... });
    return true; // Placeholder
};

// Register Customer
exports.registerCustomer = async (req, res) => {
    const { firstName, lastName, email, phone, password, captchaToken } = req.body;

    const isHuman = await verifyCaptcha(captchaToken);
    if (!isHuman) return res.status(400).json({ error: 'Human verification failed' });

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const verificationCode = generateCode();

        const [result] = await db.execute(
            'INSERT INTO customers (first_name, last_name, email, phone, password, verification_code, is_verified) VALUES (?, ?, ?, ?, ?, ?, FALSE)',
            [firstName, lastName, email, phone, hashedPassword, verificationCode]
        );

        // Send email in real time
        await sendVerificationCode(email, verificationCode);

        res.status(201).json({ 
            message: 'Customer registered. Please verify your email.', 
            customerId: result.insertId 
        });
    } catch (error) {
        console.error(error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: 'Email already registered' });
        }
        res.status(500).json({ error: 'Registration failed' });
    }
};

// Verify Email
exports.verifyEmail = async (req, res) => {
    const { email, code } = req.body;

    try {
        const [rows] = await db.execute('SELECT * FROM customers WHERE email = ? AND verification_code = ?', [email, code]);
        if (rows.length === 0) {
            return res.status(400).json({ error: 'Invalid verification code' });
        }

        await db.execute('UPDATE customers SET is_verified = TRUE, verification_code = NULL WHERE email = ?', [email]);

        res.status(200).json({ message: 'Email verified successfully. You can now login.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Verification failed' });
    }
};

// Login Customer
exports.loginCustomer = async (req, res) => {
    const { email, password } = req.body;

    try {
        const [rows] = await db.execute('SELECT * FROM customers WHERE email = ?', [email]);
        const customer = rows[0];

        if (!customer || !(await bcrypt.compare(password, customer.password))) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        if (!customer.is_verified) {
            return res.status(403).json({ error: 'Please verify your email first.' });
        }

        // Persistent login (24h)
        const token = jwt.sign({ id: customer.id, role: 'customer' }, JWT_SECRET, { expiresIn: '24h' });
        
        // Log user activity
        await db.execute('UPDATE customers SET last_order_date = CURRENT_TIMESTAMP WHERE id = ?', [customer.id]);

        res.json({ 
            token, 
            customer: { 
                id: customer.id, 
                name: `${customer.first_name} ${customer.last_name}`, 
                role: 'customer',
                email: customer.email,
                phone: customer.phone
            } 
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Login failed' });
    }
};

// Logout (Handled primarily on frontend by removing token, but we can log the action)
exports.logout = async (req, res) => {
    // Optional: Blacklist token or clear server-side session
    res.json({ message: 'Logged out successfully' });
};

// Login Staff/Admin
exports.loginStaff = async (req, res) => {
    const { email, password } = req.body;

    try {
        const [rows] = await db.execute('SELECT * FROM staff WHERE email = ?', [email]);
        const member = rows[0];

        if (!member || !(await bcrypt.compare(password, member.password))) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign({ id: member.id, role: member.role }, JWT_SECRET, { expiresIn: '12h' });
        res.json({ token, staff: { id: member.id, name: member.full_name, role: member.role } });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Login failed' });
    }
};
