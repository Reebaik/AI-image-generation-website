const jwt = require("jsonwebtoken");
const User = require("../models/User");

const checkAdmin = async (req, res, next) => {
    try {
        let userId;

        if (req.user) {
            userId = req.user.id; // If user is already set in req
        } else {
            const token = req.header("Authorization");
            if (!token) {
                return res.status(401).json({ error: "Unauthorized. Please log in." });
            }

            const decoded = jwt.verify(token.split(" ")[1], process.env.JWT_SECRET);
            userId = decoded.id;
        }

        const user = await User.findById(userId);
        if (!user || user.role !== "admin") { 
            return res.status(403).json({ error: "Access denied. Admins only." });
        }

        req.user = user; // Attach user to request
        next(); // Continue if user is admin
    } catch (error) {
        console.error("Admin Check Error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

module.exports = { checkAdmin };

