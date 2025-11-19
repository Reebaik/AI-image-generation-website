const express = require("express");
const User = require("../models/User");
const Image = require("../models/Image");
const cloudinary = require("../config/cloudinary");
const { checkAdmin } = require("../middleware/adminMiddleware");
const Subscription = require("../models/Subscription");

const router = express.Router();

/**
 * 📌 GET /admin/users - View all users (Admins only)
 */
router.get("/users", checkAdmin, async (req, res) => {
    try {
        // Get users without exposing the actual hashed passwords
        const users = await User.find({});
        
        // Map users to include a placeholder password field for frontend display
        // Note: In a real application, you would NEVER send actual passwords to the frontend
        // This is just for demonstration purposes
        const usersWithPasswordPlaceholder = users.map(user => {
            const userObj = user.toObject();
            
            // Replace actual password with a placeholder that's different for each user
            // This is for display purposes only - in real systems you'd never expose passwords
            const placeholder = "Demo-" + userObj.username.substring(0, 4) + "123!";
            userObj.password = placeholder; 
            return userObj;
        });
        
        res.json({ users: usersWithPasswordPlaceholder });
    } catch (error) {
        res.status(500).json({ error: "Error fetching users" });
    }
});

/**
 * 📌 PUT/PATCH /admin/users/:userId - Edit user details (Admins only)
 */
router.patch("/users/:userId", checkAdmin, async (req, res) => {
    try {
        const { username, email } = req.body;
        
        // Validate input
        if (!username && !email) {
            return res.status(400).json({ error: "No valid fields to update" });
        }
        
        // Build update object with only provided fields
        const updateFields = {};
        if (username) updateFields.username = username;
        if (email) updateFields.email = email;
        
        const updatedUser = await User.findByIdAndUpdate(
            req.params.userId,
            updateFields,
            { new: true, runValidators: true }
        ).select('-password'); // Exclude password from response
        
        if (!updatedUser) {
            return res.status(404).json({ error: "User not found" });
        }
        
        res.json({ message: "User updated successfully", user: updatedUser });
    } catch (error) {
        console.error("Error updating user:", error);
        if (error.code === 11000) {
            return res.status(400).json({ error: "Username or email already exists" });
        }
        res.status(500).json({ error: "Error updating user: " + error.message });
    }
});

/**
 * 📌 PUT /admin/users/:userId - Edit user details (Admins only)
 */
router.put("/users/:userId", checkAdmin, async (req, res) => {
    try {
        const { username, email, role } = req.body;
        
        // Find user first to check if exists
        const existingUser = await User.findById(req.params.userId);
        if (!existingUser) {
            return res.status(404).json({ error: "User not found" });
        }
        
        // Validate input
        if (!username && !email) {
            return res.status(400).json({ error: "Please provide username or email to update" });
        }
        
        // Build update object with only provided fields
        const updateFields = {};
        if (username) updateFields.username = username;
        if (email) updateFields.email = email;
        if (role) updateFields.role = role;
        
        // Update user with validation
        const updatedUser = await User.findByIdAndUpdate(
            req.params.userId,
            updateFields,
            { 
                new: true, 
                runValidators: true,
                select: '-password' // Exclude password from response
            }
        );
        
        // Double check the update was successful
        if (!updatedUser) {
            return res.status(404).json({ error: "Failed to update user" });
        }
        
        res.json({ 
            message: "User updated successfully", 
            user: updatedUser 
        });
    } catch (error) {
        console.error("Error updating user:", error);
        
        // Handle duplicate key errors (username/email already exists)
        if (error.code === 11000) {
            return res.status(400).json({ 
                error: "Username or email already exists" 
            });
        }
        
        // Handle validation errors
        if (error.name === 'ValidationError') {
            return res.status(400).json({ 
                error: Object.values(error.errors).map(err => err.message).join(', ')
            });
        }
        
        res.status(500).json({ 
            error: "Error updating user: " + error.message 
        });
    }
});

/**
 * 📌 DELETE /admin/users/:userId - Delete a user (Admins only)
 */
router.delete("/users/:userId", async (req, res) => {
    try {
        const user = await User.findById(req.params.userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Mark all user's images as creatorDeleted
        const images = await Image.find({ userId: user._id });
        await Image.updateMany(
            { userId: user._id },
            { $set: { creatorDeleted: true } }
        );

        // Delete user's subscription if exists
        if (user.subscription) {
            await Subscription.findByIdAndDelete(user.subscription);
        }

        // Delete the user
        await User.findByIdAndDelete(req.params.userId);

        res.json({
            message: "User deleted successfully",
            imagesMarked: images.length
        });
    } catch (error) {
        console.error("Error deleting user:", error);
        res.status(500).json({ message: "Error deleting user" });
    }
});

/**
 * 📌 DELETE /admin/images/:imageId - Delete any image (Admins only)
 */
router.delete("/images/:imageId", checkAdmin, async (req, res) => {
    try {
        const image = await Image.findById(req.params.imageId);
        if (!image) return res.status(404).json({ error: "Image not found" });

        // Delete from Cloudinary
        const publicId = image.url.split("/").pop().split(".")[0];
        await cloudinary.uploader.destroy(publicId);

        // Delete from DB
        await Image.findByIdAndDelete(req.params.imageId);

        res.json({ message: "Image deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: "Error deleting image" });
    }
});

/**
 * 📌 PUT /admin/users/:userId/promote - Promote/Demote user to/from admin (Admins only)
 */
router.put("/users/:userId/promote", checkAdmin, async (req, res) => {
    try {
        const user = await User.findById(req.params.userId);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        // Toggle role between 'user' and 'admin'
        user.role = user.role === 'admin' ? 'user' : 'admin';
        await user.save();

        res.json({ 
            message: `User is now ${user.role === 'admin' ? "an admin" : "a regular user"}`,
            user: {
                _id: user._id,
                username: user.username,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error("Error updating user role:", error);
        res.status(500).json({ error: "Error updating user role" });
    }
});

/**
 * 📌 PATCH /admin/users/:userId/role - Update user role (Admins only)
 */
router.patch("/users/:userId/role", checkAdmin, async (req, res) => {
    try {
        const { role } = req.body;
        
        // Validate role
        if (!role || !['user', 'admin'].includes(role)) {
            return res.status(400).json({ error: "Invalid role specified. Must be 'user' or 'admin'" });
        }

        const user = await User.findById(req.params.userId);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        // Update role
        user.role = role;
        await user.save();

        res.json({ 
            message: `User role updated successfully to ${role}`,
            user: {
                _id: user._id,
                username: user.username,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error("Error updating user role:", error);
        res.status(500).json({ error: "Error updating user role: " + error.message });
    }
});

module.exports = router;
