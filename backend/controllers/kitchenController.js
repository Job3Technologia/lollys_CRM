const db = require('../config/db');
const { calculateKitchenLoad } = require('../utils/peakTimeEngine');

exports.getKitchenQueue = async (req, res) => {
    try {
        const loadStatus = await calculateKitchenLoad();
        
        const [rows] = await db.query(`
            SELECT o.id, o.order_number, o.status, o.created_at, kq.urgency_level, kq.started_at,
                   GROUP_CONCAT(CONCAT(oi.quantity, 'x ', mi.name) SEPARATOR ', ') as items_summary
            FROM orders o
            JOIN kitchen_queue kq ON o.id = kq.order_id
            JOIN order_items oi ON o.id = oi.order_id
            JOIN menu_items mi ON oi.menu_item_id = mi.id
            WHERE o.status IN ('Received', 'Preparing')
            GROUP BY o.id
            ORDER BY kq.urgency_level DESC, o.created_at ASC
        `);
        
        res.status(200).json({
            loadStatus: loadStatus,
            queue: rows
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.updateQueueStatus = async (req, res) => {
    const { order_id, status } = req.body;
    try {
        await db.query('UPDATE orders SET status = ? WHERE id = ?', [status, order_id]);
        
        if (status === 'Preparing') {
            await db.query('UPDATE kitchen_queue SET started_at = CURRENT_TIMESTAMP WHERE order_id = ?', [order_id]);
        } else if (status === 'Ready') {
            await db.query('UPDATE kitchen_queue SET completed_at = CURRENT_TIMESTAMP WHERE order_id = ?', [order_id]);
        }
        
        res.status(200).json({ message: 'Status updated' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};
