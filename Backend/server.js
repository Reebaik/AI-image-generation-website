const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const mongoose = require("mongoose");

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();

// Enable CORS
const corsOptions = {
  // Use the env var from Render, or fallback to localhost for testing
  origin: [
    process.env.FRONTEND_URL, // Your Vercel URL
    "http://localhost:5174", 
    "http://localhost:5173"  // Local development
  ],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "Accept"]
};
app.use(cors(corsOptions));

// Increase payload size limit
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Add error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: "Something went wrong!", 
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// MongoDB connection
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI); // ✅ Removed deprecated options
        console.log("🚀 MongoDB connected");
    } catch (error) {
        console.error("❌ Error connecting to MongoDB:", error);
        process.exit(1);
    }
};

// Import middleware & routes
const authMiddleware = require("./middleware/auth");
const authRoutes = require("./routes/auth");
const imageRoutes = require("./routes/image");
const adminRoutes = require("./routes/admin");
const paymentRoutes = require("./routes/paymentRoutes");
const subscriptionRoutes = require("./routes/subscription");

// Use routes
app.use("/auth", authRoutes);
app.use("/images", imageRoutes); // Removed authMiddleware to test image generation
app.use("/admin", authMiddleware, adminRoutes);
app.use("/api/payment", paymentRoutes); // Add payment routes
app.use("/api/subscription", subscriptionRoutes); // Add subscription routes

// Start server
const PORT = process.env.PORT || 5000;
connectDB();
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
