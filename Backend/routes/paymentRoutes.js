const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { createOrder, verifyPayment } = require('../controllers/paymentController');

// Create a new order
router.post('/create-order', authMiddleware, createOrder);

// Verify payment and create subscription
router.post('/verify', authMiddleware, verifyPayment);

module.exports = router; 