const express = require("express");
const dotenv = require("dotenv");
const cloudinary = require("../config/cloudinary");
const Image = require("../models/Image");
const mongoose = require("mongoose");
const multer = require("multer");
const authMiddleware = require("../middleware/auth");
const axios = require("axios");
const { HfInference } = require("@huggingface/inference");
const rateLimit = require("express-rate-limit");
const jwt = require("jsonwebtoken");

dotenv.config();
const router = express.Router();
const hf = new HfInference(process.env.HUGGINGFACE_API_KEY);

// Rate Limiter for Image Generation
const generateLimiter = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 5, // Limit to 5 requests per window
    message: "Too many requests, try again later."
});

// 📌 Route: Generate Image using Hugging Face
router.post("/generate", generateLimiter, async (req, res) => {
    try {
        const { prompt, inferenceSteps, guidanceScale, width, height } = req.body;
        if (!prompt) return res.status(400).json({ error: "Prompt is required" });

        console.log("Starting image generation with custom parameters:", {
            prompt,
            inferenceSteps: inferenceSteps || 4,
            guidanceScale: guidanceScale || 0.5,
            width: width || 512,
            height: height || 512
        });
        
        try {
            const imageBlob = await hf.textToImage({
                model: "stabilityai/stable-diffusion-xl-base-1.0",
                inputs: prompt,
                parameters: { 
                    num_inference_steps: inferenceSteps || 4,
                    guidance_scale: guidanceScale || 0.5,
                    width: width || 512,
                    height: height || 512,
                    negative_prompt: "blurry, bad quality, distorted, deformed"
                }
            });

            console.log("Image generated successfully, uploading to Cloudinary...");

            // Convert the blob to base64
            const arrayBuffer = await imageBlob.arrayBuffer();
            const base64Image = Buffer.from(arrayBuffer).toString("base64");

            // Save the image to Cloudinary
            const uploadResponse = await cloudinary.uploader.upload(
                `data:image/png;base64,${base64Image}`,
                { folder: "generated" }
            );

            console.log("Image uploaded to Cloudinary:", uploadResponse.secure_url);

            // Return the Cloudinary URL instead of base64 data
            res.json({ 
                message: "Image generated successfully!", 
                image: uploadResponse.secure_url,
                cloudinaryId: uploadResponse.public_id,
                parameters: {
                    prompt,
                    inferenceSteps: inferenceSteps || 4,
                    guidanceScale: guidanceScale || 0.5,
                    width: width || 512,
                    height: height || 512
                }
            });
        } catch (apiError) {
            console.error("Hugging Face API error:", apiError);
            return res.status(500).json({ 
                error: "Failed to generate image with AI service", 
                details: apiError.message 
            });
        }
    } catch (error) {
        console.error("Server error in image generation:", error);
        res.status(500).json({ 
            error: "Server error processing image generation request", 
            details: error.message 
        });
    }
});

// Set up multer for handling file uploads
const upload = multer({ storage: multer.memoryStorage() });

// 📌 Route: Upload Image to Cloudinary
router.post("/upload", authMiddleware, upload.single("image"), (req, res) => {
    if (!req.file) return res.status(400).json({ error: "Image data is required" });

    const uploadStream = cloudinary.uploader.upload_stream({ folder: "uploads" }, (error, result) => {
        if (error) return res.status(500).json({ error: "Cloudinary upload failed" });
        res.status(201).json({ imageUrl: result.secure_url });
    });

    uploadStream.end(req.file.buffer);
});

// 📌 Route: Save Image to User's Gallery
router.post("/save", authMiddleware, async (req, res) => {
    try {
        const { imageUrl, prompt, parameters } = req.body;
        console.log("Received save request:", { imageUrl, prompt, parameters });
        
        if (!imageUrl) {
            console.log("Error: No image URL provided");
            return res.status(400).json({ error: "Image URL is required" });
        }
        
        // Get user ID from auth middleware
        const userId = req.user.id;
        console.log("User ID from auth middleware:", userId);
        
        // Create new image document
        const newImage = new Image({
            userId,
            url: imageUrl,
            prompt: prompt || "No prompt provided",
            parameters: parameters || {
                inferenceSteps: 4,
                guidanceScale: 0.5,
                width: 512,
                height: 512
            }
        });
        
        // Save to database
        const savedImage = await newImage.save();
        console.log("Image saved to database:", savedImage);
        
        res.status(201).json({ 
            message: "Image saved to gallery successfully!", 
            image: savedImage 
        });
    } catch (error) {
        console.error("Error saving image:", error);
        res.status(500).json({ 
            error: "Failed to save image", 
            details: error.message 
        });
    }
});

// 📌 Route: Fetch User's Gallery
router.get("/gallery", authMiddleware, async (req, res) => {
    try {
        // Get user ID from auth middleware
        const userId = req.user.id;
        
        const images = await Image.find({ userId }).sort({ createdAt: -1 });
        res.json({ images });
    } catch (error) {
        console.error("Error fetching gallery:", error);
        res.status(500).json({ error: "Failed to fetch gallery", details: error.message });
    }
});

// 📌 Route: Delete Image from Cloudinary & MongoDB
router.delete("/delete/:imageId", authMiddleware, async (req, res) => {
    try {
        const { imageId } = req.params;
        console.log("Delete request for image:", imageId);
        
        if (!mongoose.Types.ObjectId.isValid(imageId)) {
            return res.status(400).json({ error: "Invalid Image ID" });
        }

        // Get user ID from auth middleware to ensure user can only delete their own images
        const userId = req.user.id;

        const image = await Image.findById(imageId);
        if (!image) {
            return res.status(404).json({ error: "Image not found" });
        }
        
        // Check if the image belongs to the user
        if (image.userId.toString() !== userId) {
            return res.status(403).json({ error: "Not authorized to delete this image" });
        }

        // Extract public ID from Cloudinary URL
        const urlParts = image.url.split('/');
        const publicIdWithExtension = urlParts[urlParts.length - 1];
        const publicId = publicIdWithExtension.split('.')[0];
        const folder = urlParts[urlParts.length - 2];
        
        console.log("Deleting from Cloudinary:", `${folder}/${publicId}`);
        
        // Delete from Cloudinary
        await cloudinary.uploader.destroy(`${folder}/${publicId}`);
        
        // Delete from database
        await Image.findByIdAndDelete(imageId);

        res.json({ message: "Image deleted successfully!" });
    } catch (error) {
        console.error("Error deleting image:", error);
        res.status(500).json({ error: "Failed to delete image", details: error.message });
    }
});

// 📌 Route: Like/Unlike an Image
router.post("/like/:imageId", async (req, res) => {
    try {
        const { imageId } = req.params;
        const { userId } = req.body;
        if (!mongoose.Types.ObjectId.isValid(imageId)) return res.status(400).json({ error: "Invalid Image ID" });
        if (!userId) return res.status(400).json({ error: "User ID required" });

        const image = await Image.findById(imageId);
        if (!image) return res.status(404).json({ error: "Image not found" });

        const alreadyLiked = image.likedBy.includes(userId);
        if (alreadyLiked) {
            image.likedBy = image.likedBy.filter(id => id !== userId);
            image.likeCount -= 1;
        } else {
            image.likedBy.push(userId);
            image.likeCount += 1;
        }

        await image.save();
        res.json({ message: "Like status updated!", likeCount: image.likeCount });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 📌 Route: Share Image via Link
router.get("/share/:imageId", async (req, res) => {
    try {
        const { imageId } = req.params;
        const image = await Image.findById(imageId);
        if (!image) return res.status(404).json({ error: "Image not found" });

        res.json({ message: "Share this image:", shareUrl: `https://yourfrontend.com/image/${image._id}` });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get popular images for homepage
router.get("/popular", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 12; // Default to 12 images, can be overridden with query param
    const page = parseInt(req.query.page) || 1; // Default to first page
    const skip = (page - 1) * limit;
    
    // Count total images for pagination metadata
    const totalImages = await Image.countDocuments();
    
    // Find images with likes info, sorted by like count (most liked first)
    const popularImages = await Image.find()
      .populate('userId', 'username email') // Get user info
      .sort({ 'likes.count': -1, 'createdAt': -1 }) // Sort by likes count descending, then by date
      .skip(skip)
      .limit(limit) // Limit to requested number of images
      .lean(); // Convert to plain JS object for better performance
    
    console.log(`Fetched ${popularImages.length} popular images for homepage (page ${page}, limit ${limit})`);
    
    // Format the response
    const formattedImages = popularImages.map(image => ({
      id: image._id,
      imageUrl: image.url,
      prompt: image.prompt,
      creator: image.userId ? image.userId.username : 'Unknown User',
      creatorId: image.userId ? image.userId._id : null,
      likesCount: image.likes?.count || 0,
      createdAt: image.createdAt,
      parameters: image.parameters || {}
    }));
    
    // Return pagination metadata along with images
    res.json({
      images: formattedImages,
      pagination: {
        totalImages,
        totalPages: Math.ceil(totalImages / limit),
        currentPage: page,
        imagesPerPage: limit
      }
    });
  } catch (error) {
    console.error("Error fetching popular images:", error);
    res.status(500).json({ error: "Failed to fetch popular images" });
  }
});

// Like an image
router.post("/:id/like", authMiddleware, async (req, res) => {
  try {
    const imageId = req.params.id;
    const userId = req.user._id;

    // Find the image
    const image = await Image.findById(imageId);
    if (!image) {
      return res.status(404).json({ error: "Image not found" });
    }

    // Check if user already liked this image
    if (image.likes.users.includes(userId)) {
      return res.status(400).json({ error: "You already liked this image" });
    }

    // Add user to likes and increment count
    image.likes.users.push(userId);
    image.likes.count = image.likes.users.length;
    await image.save();

    res.json({ 
      message: "Image liked successfully", 
      likesCount: image.likes.count 
    });

  } catch (error) {
    console.error("Error liking image:", error);
    res.status(500).json({ error: "Failed to like image" });
  }
});

// Unlike an image
router.post("/:id/unlike", authMiddleware, async (req, res) => {
  try {
    const imageId = req.params.id;
    const userId = req.user._id;

    // Find the image
    const image = await Image.findById(imageId);
    if (!image) {
      return res.status(404).json({ error: "Image not found" });
    }

    // Check if user has liked this image
    if (!image.likes.users.includes(userId)) {
      return res.status(400).json({ error: "You haven't liked this image yet" });
    }

    // Remove user from likes and decrement count
    image.likes.users = image.likes.users.filter(id => !id.equals(userId));
    image.likes.count = image.likes.users.length;
    await image.save();

    res.json({ 
      message: "Image unliked successfully", 
      likesCount: image.likes.count 
    });

  } catch (error) {
    console.error("Error unliking image:", error);
    res.status(500).json({ error: "Failed to unlike image" });
  }
});

// Get image details by ID with likes info
router.get("/:id", async (req, res) => {
  try {
    const imageId = req.params.id;
    
    // Find the image and populate user details
    const image = await Image.findById(imageId).populate('userId', 'username email');
    
    if (!image) {
      return res.status(404).json({ error: "Image not found" });
    }
    
    // Check if user has liked this image (if authenticated)
    let userHasLiked = false;
    if (req.headers.authorization) {
      try {
        const token = req.headers.authorization.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.id;
        userHasLiked = image.likes.users.some(id => id.equals(userId));
      } catch (err) {
        console.error("Token verification error:", err);
        // Don't fail if token is invalid, just set userHasLiked to false
      }
    }
    
    // Format the response
    const imageDetails = {
      id: image._id,
      imageUrl: image.url,
      prompt: image.prompt,
      creator: image.userId ? image.userId.username : 'Unknown User',
      creatorId: image.userId ? image.userId._id : null,
      likesCount: image.likes.count,
      userHasLiked,
      createdAt: image.createdAt,
      parameters: image.parameters
    };
    
    res.json(imageDetails);
  } catch (error) {
    console.error("Error fetching image details:", error);
    res.status(500).json({ error: "Failed to fetch image details" });
  }
});

module.exports = router;