const jwt = require("jsonwebtoken");
const User = require("../models/User");

const authMiddleware = async (req, res, next) => {
  // Get token from Authorization header
  const authHeader = req.header("Authorization");

  if (!authHeader) {
    return res.status(403).json({ error: "Access denied. No Authorization header provided." });
  }

  // Check if token is in the correct format
  const tokenParts = authHeader.split(" ");
  if (tokenParts.length !== 2 || tokenParts[0] !== "Bearer") {
    return res.status(403).json({ error: "Invalid Authorization format. Use 'Bearer <token>'." });
  }

  const token = tokenParts[1];

  try {
    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Find the user to ensure they still exist in the database
    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      return res.status(404).json({ error: "User not found or deleted." });
    }
    
    // Add user to request object
    req.user = user;
    next(); // Continue to the next middleware or route
  } catch (error) {
    console.error("Auth middleware error:", error);
    
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Token expired. Please log in again." });
    } else if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ error: "Invalid token. Please log in again." });
    }
    
    res.status(401).json({ error: "Authentication failed", details: error.message });
  }
};

module.exports = authMiddleware;
