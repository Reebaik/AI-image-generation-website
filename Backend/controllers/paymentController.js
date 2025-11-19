const Razorpay = require('razorpay');
const crypto = require('crypto');
const User = require('../models/User');
const Subscription = require('../models/Subscription');

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

// Subscription plans configuration
const plans = {
  basic: {
    id: 'basic',
    name: 'Basic Plan',
    price: 499,
    generations: 50
  },
  pro: {
    id: 'pro',
    name: 'Pro Plan',
    price: 999,
    generations: 150
  },
  premium: {
    id: 'premium',
    name: 'Premium Plan',
    price: 1999,
    generations: 400
  }
};

// Create a new order
exports.createOrder = async (req, res) => {
  try {
    const { planId, amount } = req.body;
    const userId = req.user.id;

    // Validate user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Validate plan
    if (!plans[planId]) {
      return res.status(400).json({ error: 'Invalid plan selected' });
    }

    // Validate amount matches plan price
    const expectedAmount = plans[planId].price * 100;
    if (amount !== expectedAmount) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    // Create order
    const order = await razorpay.orders.create({
      amount: amount,
      currency: 'INR',
      receipt: `receipt_${Date.now().toString().slice(-8)}_${userId.toString().slice(-8)}`,
      payment_capture: 1
    });

    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      key: process.env.RAZORPAY_KEY_ID
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to create order',
      details: error.message
    });
  }
};

// Verify payment and create subscription
exports.verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,
      planId
    } = req.body;
    const userId = req.user.id;

    // Verify signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ error: 'Invalid payment signature' });
    }

    // Get plan details
    const plan = plans[planId];
    if (!plan) {
      return res.status(400).json({ error: 'Invalid plan' });
    }

    // Create or update subscription
    const subscription = await Subscription.findOneAndUpdate(
      { 
        userId,
        status: { $in: ['active', 'expired'] } // Update existing active or expired subscription
      },
      {
        userId,
        planId: plan.id,
        planName: plan.name,
        generationsLeft: plan.generations,
        startDate: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        paymentId: razorpay_payment_id,
        orderId: razorpay_order_id,
        status: 'active'
      },
      { 
        upsert: true, 
        new: true,
        setDefaultsOnInsert: true
      }
    );

    // Update user's subscription reference
    await User.findByIdAndUpdate(userId, {
      subscription: subscription._id
    });

    // Return complete subscription data
    res.json({
      subscription: {
        planId: subscription.planId,
        planName: subscription.planName,
        generationsLeft: subscription.generationsLeft,
        startDate: subscription.startDate,
        expiresAt: subscription.expiresAt,
        paymentId: subscription.paymentId,
        orderId: subscription.orderId,
        status: subscription.status
      }
    });
  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({ 
      error: 'Failed to verify payment',
      details: error.message
    });
  }
}; 