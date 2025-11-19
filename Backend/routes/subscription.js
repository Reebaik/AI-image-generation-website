const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const Subscription = require('../models/Subscription');
const User = require('../models/User');

// Get subscription status
router.get('/status', authMiddleware, async (req, res) => {
    try {
        // First check if user has a subscription reference
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // If user is admin, return a special admin subscription object
        if (user.role === 'admin') {
            return res.json({
                subscription: {
                    status: 'active',
                    planId: 'admin',
                    planName: 'Admin Plan',
                    generationsLeft: 999999,
                    expiresAt: new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000), // 100 years
                    isAdmin: true
                },
                isActive: true,
                message: 'Admin access granted'
            });
        }

        let subscription = null;
        
        // Check subscription through user reference
        if (user.subscription) {
            subscription = await Subscription.findOne({
                _id: user.subscription,
                status: 'active',
                expiresAt: { $gt: new Date() }
            });
        }

        // If no subscription found through reference, check for any active subscription
        if (!subscription) {
            subscription = await Subscription.findOne({
                userId: req.user.id,
                status: 'active',
                expiresAt: { $gt: new Date() }
            }).sort({ expiresAt: -1 });

            // If found, update user's subscription reference
            if (subscription) {
                await User.findByIdAndUpdate(req.user.id, { subscription: subscription._id });
            }
        }

        // If subscription is found but expired, update its status
        if (subscription && subscription.expiresAt < new Date()) {
            subscription.status = 'expired';
            await subscription.save();
            subscription = null;
        }

        res.json({ 
            subscription,
            isActive: !!subscription,
            message: subscription ? 'Active subscription found' : 'No active subscription found'
        });
    } catch (error) {
        console.error('Error checking subscription status:', error);
        res.status(500).json({ 
            error: 'Failed to check subscription status',
            details: error.message
        });
    }
});

module.exports = router; 