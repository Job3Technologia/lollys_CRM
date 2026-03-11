const db = require('../config/db');
const { generateOrderNumber } = require('../utils/orderNumber');

// Create a new order
exports.createOrder = async (req, res) => {
    const { 
        customer_name, 
        customer_phone, 
        items, 
        subtotal, 
        service_fee, 
        total_amount, 
        payment_method, 
        pickup_time, 
        notes,
        order_source,
        staff_id
    } = req.body;
    
    const customer_id = req.user.id; // From JWT verifyToken middleware
    
    if (!items || items.length === 0) {
        return res.status(400).json({ message: 'Order must contain items' });
    }

    const order_number = generateOrderNumber();
    const connection = await db.getConnection();
    
    try {
        await connection.beginTransaction();

        // Insert Order
        const [orderResult] = await connection.query(
            `INSERT INTO orders (
                customer_id, order_number, customer_name, customer_phone, 
                subtotal, service_fee, total_amount, payment_method, 
                pickup_time, notes, order_source, staff_id
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                customer_id || null, order_number, customer_name, customer_phone, 
                subtotal, service_fee, total_amount, payment_method, 
                pickup_time, notes, order_source || 'Web', staff_id || null
            ]
        );
        
        const orderId = orderResult.insertId;

        // Insert Order Items
        const orderItemsQueries = items.map(item => {
            return connection.query(
                'INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, line_total) VALUES (?, ?, ?, ?, ?)',
                [orderId, item.menu_item_id, item.quantity, item.price, item.quantity * item.price]
            );
        });
        
        await Promise.all(orderItemsQueries);

        // Add to Kitchen Queue
        await connection.query(
            'INSERT INTO kitchen_queue (order_id, urgency_level) VALUES (?, ?)',
            [orderId, 'Normal']
        );

        // Update Customer Stats if customer_id exists
        if (customer_id) {
            await connection.query(
                `UPDATE customers SET 
                    total_spent = total_spent + ?, 
                    order_count = order_count + 1, 
                    last_order_date = CURRENT_TIMESTAMP 
                WHERE id = ?`,
                [total_amount, customer_id]
            );
        }

        await connection.commit();
        res.status(201).json({ message: 'Order placed successfully', orderId, order_number });
    } catch (error) {
        await connection.rollback();
        console.error('Error creating order:', error);
        res.status(500).json({ message: 'Server Error' });
    } finally {
        connection.release();
    }
};

// Get all orders (Admin/Staff)
exports.getAllOrders = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM orders ORDER BY created_at DESC');
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// Get order by ID
exports.getOrderById = async (req, res) => {
    try {
        const [orderRows] = await db.query('SELECT * FROM orders WHERE id = ?', [req.params.id]);
        if (orderRows.length === 0) {
            return res.status(404).json({ message: 'Order not found' });
        }
        
        const [itemRows] = await db.query(
            `SELECT oi.*, mi.name 
             FROM order_items oi 
             JOIN menu_items mi ON oi.menu_item_id = mi.id 
             WHERE oi.order_id = ?`, 
            [req.params.id]
        );
        
        const order = orderRows[0];
        order.items = itemRows;
        
        res.status(200).json(order);
    } catch (error) {
        console.error('Error fetching order:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// Update order status (Admin/Staff)
exports.updateOrderStatus = async (req, res) => {
    const { status } = req.body;
    try {
        const [result] = await db.query('UPDATE orders SET status = ? WHERE id = ?', [status, req.params.id]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // If status is 'Preparing', update kitchen queue
        if (status === 'Preparing') {
            await db.query('UPDATE kitchen_queue SET started_at = CURRENT_TIMESTAMP WHERE order_id = ?', [req.params.id]);
        }
        
        // If status is 'Ready', update kitchen queue
        if (status === 'Ready') {
            await db.query('UPDATE kitchen_queue SET completed_at = CURRENT_TIMESTAMP WHERE order_id = ?', [req.params.id]);
        }

        res.status(200).json({ message: 'Order status updated successfully' });
    } catch (error) {
        console.error('Error updating order status:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};
