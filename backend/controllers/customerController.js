const db = require('../config/db');

exports.getCustomerProfile = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT id, first_name, last_name, email, phone, total_spent, order_count, last_order_date, is_loyal, favorite_item_id FROM customers WHERE id = ?', [req.user.id]);
        if (rows.length === 0) return res.status(404).json({ message: 'Customer not found' });
        res.status(200).json(rows[0]);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.getCustomerOrders = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM orders WHERE customer_id = ? ORDER BY created_at DESC', [req.user.id]);
        res.status(200).json(rows);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.updateCustomerProfile = async (req, res) => {
    const { firstName, lastName, phone } = req.body;
    try {
        await db.query('UPDATE customers SET first_name = ?, last_name = ?, phone = ? WHERE id = ?', [firstName, lastName, phone, req.user.id]);
        res.status(200).json({ message: 'Profile updated' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};
