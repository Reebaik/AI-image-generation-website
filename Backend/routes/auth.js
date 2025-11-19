const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Subscription = require("../models/Subscription");
const authMiddleware = require("../middleware/auth"); // Import middleware
const PasswordResetToken = require("../models/PasswordResetToken");
const sendEmail = require("../utils/sendEmail");
const { v4: uuidv4 } = require("uuid");


const router = express.Router();

// REGISTER
router.post("/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: "User already exists" });

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const newUser = new User({ username, email, password: hashedPassword });
    await newUser.save();

    res.status(201).json({ message: "User registered successfully!" });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error });
  }
});

// LOGIN
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1h" });

    // Get user's active subscription
    let subscription = null;
    
    // First check if user has a subscription reference
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
        userId: user._id,
        status: 'active',
        expiresAt: { $gt: new Date() }
      }).sort({ expiresAt: -1 });

      // If found, update user's subscription reference
      if (subscription) {
        await User.findByIdAndUpdate(user._id, { subscription: subscription._id });
      }
    }

    const userResponse = user.toObject();
    delete userResponse.password; // Remove password from response
    
    res.json({ 
      token, 
      user: userResponse,
      subscription: subscription || null
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
});

// GET USER PROFILE (Protected)
router.get("/profile", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password"); // Exclude password field
    if (!user) return res.status(404).json({ error: "User not found" });

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

// PROTECTED ROUTE EXAMPLE
router.get("/protected", authMiddleware, (req, res) => {
  res.json({ message: "Protected data accessed", userId: req.user.id });
});


// Request Password Reset
router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ error: "User not found" });

  // Generate a more secure token with higher entropy
  const tokenBuffer = Buffer.from(
    uuidv4() + Date.now().toString() + Math.random().toString() + user._id.toString()
  ).toString('base64').replace(/[^a-zA-Z0-9]/g, '');
  
  // Take a portion of the token to keep it manageable but still secure
  const token = tokenBuffer.substring(0, 64);
  
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

  // Delete any existing tokens for this user
  await PasswordResetToken.deleteMany({ userId: user._id });
  
  // Create new token
  await PasswordResetToken.create({ userId: user._id, token, expiresAt });

  const resetLink = `${process.env.FRONTEND_URL}/reset-password/${token}`;
  console.log("Generated Reset Link:", resetLink);
  console.log("Generated Token Length:", token.length);
  
  // Create beautiful HTML email template
  const htmlEmail = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Password Reset</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap');
        
        body {
          font-family: 'Roboto', Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          margin: 0;
          padding: 0;
          background-color: #f5f5f5;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #ffffff;
          border-radius: 8px;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.05);
        }
        .header {
          background: linear-gradient(135deg, #dc2626, #991b1b);
          color: white;
          padding: 20px;
          text-align: center;
          border-radius: 8px 8px 0 0;
          margin: -20px -20px 20px;
        }
        .logo {
          font-size: 28px;
          font-weight: 700;
          margin-bottom: 5px;
          color: white;
        }
        h1 {
          color: #dc2626;
          margin-top: 0;
        }
        .content {
          padding: 20px 0;
        }
        .button {
          display: inline-block;
          background: linear-gradient(135deg, #dc2626, #991b1b);
          color: white;
          text-decoration: none;
          padding: 12px 30px;
          border-radius: 50px;
          font-weight: 500;
          margin: 20px 0;
          text-align: center;
          box-shadow: 0 4px 8px rgba(220, 38, 38, 0.25);
          transition: all 0.3s ease;
        }
        .button:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 12px rgba(220, 38, 38, 0.3);
        }
        .info {
          background-color: #f8f9fa;
          padding: 15px;
          border-radius: 6px;
          margin: 20px 0;
          border-left: 4px solid #dc2626;
        }
        .footer {
          text-align: center;
          margin-top: 20px;
          padding-top: 20px;
          border-top: 1px solid #eee;
          color: #666;
          font-size: 12px;
        }
        .divider {
          height: 1px;
          background: linear-gradient(to right, transparent, rgba(220, 38, 38, 0.5), transparent);
          margin: 20px 0;
        }
        .steps {
          margin: 20px 0;
        }
        .step {
          margin-bottom: 10px;
          display: flex;
          align-items: flex-start;
        }
        .step-number {
          background-color: #dc2626;
          color: white;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          margin-right: 10px;
          flex-shrink: 0;
          font-weight: bold;
        }
        .tip {
          background-color: rgba(220, 38, 38, 0.05);
          border: 1px solid rgba(220, 38, 38, 0.2);
          border-radius: 6px;
          padding: 10px 15px;
          font-size: 14px;
          margin: 15px 0;
        }
        .expiry {
          font-size: 14px;
          color: #666;
          font-style: italic;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">Aura AI</div>
          <p>AI Image Generation Platform</p>
        </div>
        
        <div class="content">
          <h1>Reset Your Password</h1>
          <p>Hello ${user.username || 'there'},</p>
          <p>We received a request to reset your password for your Aura AI account. Don't worry! We've got you covered.</p>
          
          <div class="divider"></div>
          
          <div class="steps">
            <h3>Follow these simple steps:</h3>
            <div class="step">
              <div class="step-number">1</div>
              <div>Click the "Reset Password" button below</div>
            </div>
            <div class="step">
              <div class="step-number">2</div>
              <div>Create a new secure password</div>
            </div>
            <div class="step">
              <div class="step-number">3</div>
              <div>Log in with your new password</div>
            </div>
          </div>
          
          <div style="text-align: center;">
            <a href="${resetLink}" class="button">Reset Password</a>
          </div>
          
          <div class="tip">
            <strong>Tip:</strong> For security reasons, this password reset link will expire in 5 minutes.
          </div>
          
          <div class="info">
            <p>If you didn't request a password reset, please ignore this email or contact support if you have concerns about your account's security.</p>
            <p class="expiry">This link expires on ${expiresAt.toLocaleString()}</p>
          </div>
          
          <p>If the button above doesn't work, copy and paste the following URL into your browser:</p>
          <p style="word-break: break-all; font-size: 14px; color: #666;">${resetLink}</p>
        </div>
        
        <div class="divider"></div>
        
        <div class="footer">
          <p>© ${new Date().getFullYear()} Aura AI. All rights reserved.</p>
          <p>This email was sent to ${email} because you requested a password reset.</p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  await sendEmail(
    email, 
    "Aura AI - Reset Your Password", 
    htmlEmail, 
    {
      priority: '1', // High priority for password reset emails
      importance: 'high'
    }
  );

  res.json({ message: "Reset link sent to your email" });
});

// Reset Password
router.post("/reset-password/:token", async (req, res) => {
  const { token } = req.params;
  const { newPassword } = req.body;

  const resetToken = await PasswordResetToken.findOne({ token });
  if (!resetToken || resetToken.expiresAt < Date.now()) {
      return res.status(400).json({ error: "Invalid or expired token" });
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  await User.findByIdAndUpdate(resetToken.userId, { password: hashedPassword });
  await PasswordResetToken.deleteOne({ token });

  res.json({ message: "Password reset successful" });
});


// Bug Report Route
router.post("/report-bug", authMiddleware, async (req, res) => {
  try {
    const { subject, description } = req.body;
    
    // Validate that we have a user with email
    if (!req.user || !req.user.email) {
      console.error("Bug report: User or user email is missing", req.user);
      return res.status(401).json({ error: "User authentication failed. Please log in again." });
    }
    
    const userEmail = req.user.email;
    console.log("Received bug report from:", userEmail);

    // Validate required fields
    if (!subject || !description) {
      return res.status(400).json({ error: "Subject and description are required" });
    }

    console.log("Bug report details:", { subject, description: description.substring(0, 50) + "..." });

    // Create beautiful HTML email template for bug report
    const htmlEmail = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Bug Report</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap');
          
          body {
            font-family: 'Roboto', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
            background-color: #f5f5f5;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #ffffff;
            border-radius: 8px;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.05);
          }
          .header {
            background: linear-gradient(135deg, #dc2626, #991b1b);
            color: white;
            padding: 20px;
            text-align: center;
            border-radius: 8px 8px 0 0;
            margin: -20px -20px 20px;
          }
          .logo {
            font-size: 28px;
            font-weight: 700;
            margin-bottom: 5px;
            color: white;
          }
          h1 {
            color: #dc2626;
            margin-top: 0;
          }
          .content {
            padding: 20px 0;
          }
          .divider {
            height: 1px;
            background: linear-gradient(to right, transparent, rgba(220, 38, 38, 0.5), transparent);
            margin: 20px 0;
          }
          .bug-details {
            background-color: #f8f9fa;
            padding: 15px;
            border-radius: 6px;
            margin: 20px 0;
            border-left: 4px solid #dc2626;
          }
          .footer {
            text-align: center;
            margin-top: 20px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            color: #666;
            font-size: 12px;
          }
          .label {
            font-weight: 600;
            color: #dc2626;
            margin-bottom: 5px;
          }
          .description-box {
            background-color: #f8f9fa;
            border: 1px solid #e9ecef;
            border-radius: 6px;
            padding: 15px;
            margin-top: 5px;
            white-space: pre-wrap;
          }
          .user-info {
            display: flex;
            align-items: center;
            margin-bottom: 15px;
          }
          .user-avatar {
            width: 40px;
            height: 40px;
            background-color: #dc2626;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
            margin-right: 10px;
          }
          .timestamp {
            color: #666;
            font-size: 14px;
            font-style: italic;
            text-align: right;
            margin-top: 10px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">Aura AI</div>
            <p>Bug Report System</p>
          </div>
          
          <div class="content">
            <h1>New Bug Report</h1>
            
            <div class="user-info">
              <div class="user-avatar">${userEmail.charAt(0).toUpperCase()}</div>
              <div>
                <div style="font-weight: 500;">${userEmail}</div>
                <div style="font-size: 14px; color: #666;">Reported on ${new Date().toLocaleString()}</div>
              </div>
            </div>
            
            <div class="bug-details">
              <div class="label">Subject:</div>
              <div style="font-size: 18px; font-weight: 500; margin-bottom: 15px;">${subject}</div>
              
              <div class="label">Description:</div>
              <div class="description-box">${description.replace(/\n/g, '<br>')}</div>
              
              <div class="timestamp">
                ID: ${new Date().getTime().toString(36).toUpperCase()}
              </div>
            </div>
          </div>
          
          <div class="divider"></div>
          
          <div class="footer">
            <p>© ${new Date().getFullYear()} Aura AI. All rights reserved.</p>
            <p>This is an automated message from the Aura AI Bug Report System.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Send the email
    try {
      const emailInfo = await sendEmail(
        process.env.EMAIL_USER, 
        `Bug Report: ${subject}`, 
        htmlEmail,
        {
          senderName: "Aura AI Bug Reports",
          priority: "1",
          importance: "high"
        }
      );
      
      console.log("Bug report email sent successfully:", emailInfo.messageId);
            
      res.json({ 
        message: "Bug report sent successfully!",
        reportId: new Date().getTime().toString(36).toUpperCase()
      });
    } catch (emailError) {
      console.error("Failed to send bug report email:", emailError);
      return res.status(500).json({ 
        error: "Failed to send bug report email", 
        details: emailError.message 
      });
    }
  } catch (error) {
    console.error("Bug report error:", error);
    res.status(500).json({ 
      error: "Internal Server Error", 
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

module.exports = router;

