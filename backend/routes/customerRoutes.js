const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');
const { verifyToken } = require('../middleware/authMiddleware');

router.get('/profile', verifyToken, customerController.getCustomerProfile);
router.get('/orders', verifyToken, customerController.getCustomerOrders);
router.put('/profile', verifyToken, customerController.updateCustomerProfile);

module.exports = router;
