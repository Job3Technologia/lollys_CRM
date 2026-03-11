const db = require('../config/db');

exports.getAllMenuItems = async (req, res) => {
    try {
        const { include_unavailable } = req.query;
        let query = `
            SELECT mi.*, mc.name as category_name 
            FROM menu_items mi 
            JOIN menu_categories mc ON mi.category_id = mc.id 
        `;
        
        if (include_unavailable !== 'true') {
            query += ` WHERE mi.is_available = 1`;
        }
        
        query += ` ORDER BY mc.display_order, mi.name`;

        const [rows] = await db.query(query);
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error fetching menu items:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.getMenuCategories = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM menu_categories ORDER BY display_order');
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.getFeaturedItems = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM menu_items WHERE is_featured = 1 AND is_available = 1');
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error fetching featured items:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.getMenuItemById = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM menu_items WHERE id = ?', [req.params.id]);
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Menu item not found' });
        }
        res.status(200).json(rows[0]);
    } catch (error) {
        console.error('Error fetching menu item:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.createMenuItem = async (req, res) => {
    const { name, description, price, category_id, image_url, is_featured, special_badge } = req.body;
    try {
        const [result] = await db.query(
            'INSERT INTO menu_items (name, description, price, category_id, image_url, is_featured, special_badge) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [name, description, price, category_id, image_url, is_featured, special_badge]
        );
        res.status(201).json({ id: result.insertId, name, description, price, category_id, image_url });
    } catch (error) {
        console.error('Error creating menu item:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.updateMenuItem = async (req, res) => {
    const { name, description, price, category_id, image_url, is_available, is_featured, special_badge } = req.body;
    try {
        const [result] = await db.query(
            'UPDATE menu_items SET name = ?, description = ?, price = ?, category_id = ?, image_url = ?, is_available = ?, is_featured = ?, special_badge = ? WHERE id = ?',
            [name, description, price, category_id, image_url, is_available, is_featured, special_badge, req.params.id]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Menu item not found' });
        }
        res.status(200).json({ message: 'Menu item updated successfully' });
    } catch (error) {
        console.error('Error updating menu item:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.deleteMenuItem = async (req, res) => {
    try {
        const [result] = await db.query('DELETE FROM menu_items WHERE id = ?', [req.params.id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Menu item not found' });
        }
        res.status(200).json({ message: 'Menu item deleted successfully' });
    } catch (error) {
        console.error('Error deleting menu item:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};
