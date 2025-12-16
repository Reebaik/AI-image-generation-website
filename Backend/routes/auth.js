const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Subscription = require("../models/Subscription");
const authMiddleware = require("../middleware/auth"); // Import middleware
const PasswordResetToken = require("../models/PasswordResetToken");
const sendEmail = require("../utils/sendEmail");
const crypto = require('crypto'); //

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

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Generate Token
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

    // Save Token to DB
    await new PasswordResetToken({
      userId: user._id,
      token,
      expiresAt,
    }).save();

    // Create Link
    // Note: Ensure process.env.FRONTEND_URL is set (e.g., https://your-vercel-app.app)
    const resetLink = `${process.env.FRONTEND_URL}/reset-password/${token}`;

    // ✅ NEW TEMPLATE: Uses Tables for perfect alignment & Professional Styling
    const htmlEmail = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Reset Your Password</title>
      <style>
        body { margin: 0; padding: 0; background-color: #f4f4f7; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
        .wrapper { width: 100%; table-layout: fixed; background-color: #f4f4f7; padding-bottom: 40px; }
        .main-table { background-color: #ffffff; margin: 0 auto; width: 100%; max-width: 600px; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05); border: 1px solid #e1e1e1; }
        .header { background-color: #1e293b; padding: 25px; text-align: center; }
        .header-title { color: #ffffff; font-size: 24px; font-weight: bold; margin: 0; letter-spacing: 1px; }
        .content { padding: 40px; }
        .btn { display: inline-block; background-color: #dc2626; color: #ffffff !important; text-decoration: none; padding: 14px 28px; border-radius: 6px; font-weight: bold; font-size: 16px; margin-top: 20px; text-align: center; }
        .step-table { width: 100%; margin-top: 20px; margin-bottom: 20px; border-collapse: collapse; }
        .step-circle { width: 32px; height: 32px; background-color: #fef2f2; color: #dc2626; border: 2px solid #dc2626; border-radius: 50%; text-align: center; line-height: 32px; font-weight: bold; display: block; margin: 0 auto; }
        .step-text { font-size: 15px; color: #333; line-height: 1.5; padding-left: 15px; }
        .footer { text-align: center; color: #9ca3af; font-size: 12px; padding: 20px; }
        .divider { border-top: 1px solid #e5e7eb; margin: 25px 0; }
        .expiry-box { background-color: #fff1f2; border-left: 4px solid #e11d48; padding: 15px; margin-top: 25px; font-size: 14px; color: #881337; }
      </style>
    </head>
    <body>
      <div class="wrapper">
        <br>
        <table class="main-table" align="center" cellspacing="0" cellpadding="0">
          <tr>
            <td class="header">
              <h1 class="header-title">Aura AI</h1>
            </td>
          </tr>

          <tr>
            <td class="content">
              <h2 style="color: #1e293b; margin-top: 0; font-size: 22px;">Reset Your Password</h2>
              <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
                Hello <strong>${user.username || 'there'}</strong>,<br><br>
                We received a request to reset your password. If you didn't ask for this, you can safely ignore this email.
              </p>

              <div class="divider"></div>

              <table class="step-table" cellspacing="0" cellpadding="0">
                <tr>
                  <td width="40" valign="top"><div class="step-circle">1</div></td>
                  <td valign="top" class="step-text"><strong>Click the button</strong> below to verify your identity.</td>
                </tr>
                <tr><td height="15" colspan="2"></td></tr>
                <tr>
                  <td width="40" valign="top"><div class="step-circle">2</div></td>
                  <td valign="top" class="step-text"><strong>Create a new password</strong> on the secure page.</td>
                </tr>
                <tr><td height="15" colspan="2"></td></tr>
                <tr>
                  <td width="40" valign="top"><div class="step-circle">3</div></td>
                  <td valign="top" class="step-text"><strong>Log back in</strong> and start generating images!</td>
                </tr>
              </table>

              <div style="text-align: center; margin-top: 30px;">
                <a href="${resetLink}" class="btn">Reset Password</a>
              </div>
              
              <div class="expiry-box">
                <strong>Note:</strong> This link expires in 5 minutes (at ${new Date(expiresAt).toLocaleTimeString()}).
              </div>
              
              <p style="color: #9ca3af; font-size: 13px; margin-top: 30px;">
                If the button doesn't work, copy this link:<br>
                <a href="${resetLink}" style="color: #dc2626; word-break: break-all;">${resetLink}</a>
              </p>
            </td>
          </tr>
        </table>
        
        <div class="footer">
          &copy; ${new Date().getFullYear()} Aura AI. All rights reserved.<br>
          Sent to ${email}
        </div>
      </div>
    </body>
    </html>
    `;

    // Send Email
    await sendEmail(
      email,
      "Aura AI - Reset Your Password",
      htmlEmail,
      {
        priority: '1',
        importance: 'high'
      }
    );

    res.json({ message: "Reset link sent to your email" });

  } catch (error) {
    console.error("Forgot Password Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});


// ==========================================
// ROUTE 2: RESET PASSWORD (Updates the DB)
// ==========================================
router.post("/reset-password/:token", async (req, res) => {
  const { token } = req.params;
  const { newPassword } = req.body;

  try {
    const resetToken = await PasswordResetToken.findOne({ token });

    // Check if token exists and hasn't expired
    if (!resetToken || resetToken.expiresAt < Date.now()) {
      return res.status(400).json({ error: "Invalid or expired token" });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update User
    await User.findByIdAndUpdate(resetToken.userId, { password: hashedPassword });

    // Delete the token so it can't be used again
    await PasswordResetToken.deleteOne({ token });

    res.json({ message: "Password reset successful" });

  } catch (error) {
    console.error("Reset Password Error:", error);
    res.status(500).json({ error: "Failed to reset password" });
  }
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
  <title>Bug Report - Aura AI</title>
  <style>
    /* Reset & Base Styles */
    body { margin: 0; padding: 0; background-color: #f4f4f7; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; -webkit-font-smoothing: antialiased; }
    table { border-spacing: 0; width: 100%; }
    td { padding: 0; }
    img { border: 0; }
    
    /* Container */
    .wrapper { width: 100%; table-layout: fixed; background-color: #f4f4f7; padding-bottom: 40px; }
    .main-table { background-color: #ffffff; margin: 0 auto; width: 100%; max-width: 600px; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05); border: 1px solid #e1e1e1; }
    
    /* Header */
    .header { background-color: #1e293b; padding: 24px 30px; text-align: left; }
    .brand { color: #ffffff; font-size: 20px; font-weight: 700; letter-spacing: 0.5px; text-decoration: none; }
    .badge { background-color: #ef4444; color: white; padding: 4px 10px; border-radius: 4px; font-size: 12px; font-weight: 600; float: right; text-transform: uppercase; letter-spacing: 0.5px; }
    
    /* Content */
    .content-cell { padding: 30px; }
    .subject { margin: 0 0 20px; font-size: 22px; font-weight: 600; color: #111827; line-height: 1.3; }
    
    /* Metadata Grid */
    .meta-table { width: 100%; margin-bottom: 25px; border-collapse: collapse; }
    .meta-label { color: #6b7280; font-size: 12px; text-transform: uppercase; font-weight: 600; padding-bottom: 4px; width: 30%; }
    .meta-value { color: #374151; font-size: 14px; font-weight: 500; padding-bottom: 16px; }
    
    /* Description Box */
    .desc-container { background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 20px; margin-top: 10px; }
    .desc-label { font-size: 12px; font-weight: 700; color: #475569; margin-bottom: 8px; display: block; text-transform: uppercase; }
    .desc-text { font-family: 'Menlo', 'Monaco', 'Courier New', monospace; font-size: 13px; color: #334155; line-height: 1.6; white-space: pre-wrap; margin: 0; }
    
    /* Footer */
    .footer { background-color: #f4f4f7; padding: 24px; text-align: center; }
    .footer-text { color: #94a3b8; font-size: 12px; line-height: 1.5; margin: 0; }
  </style>
</head>
<body>
  <div class="wrapper">
    <br>
    <table class="main-table" align="center">
      <tr>
        <td class="header">
          <span class="brand">Aura AI</span>
          <span class="badge">Bug Report</span>
        </td>
      </tr>
      
      <tr>
        <td class="content-cell">
          <h1 class="subject">${subject}</h1>
          
          <table class="meta-table">
            <tr>
              <td class="meta-label">Reported By</td>
              <td class="meta-value">${userEmail}</td>
            </tr>
            <tr>
              <td class="meta-label">Date Submitted</td>
              <td class="meta-value">${new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}</td>
            </tr>
            <tr>
              <td class="meta-label">Ticket ID</td>
              <td class="meta-value" style="font-family: monospace;">#${new Date().getTime().toString(36).toUpperCase()}</td>
            </tr>
          </table>

          <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 0 0 25px 0;">

          <div class="desc-container">
            <span class="desc-label">Issue Description</span>
            <pre class="desc-text">${description}</pre>
          </div>
          
        </td>
      </tr>
    </table>
    
    <div class="footer">
      <p class="footer-text">
        &copy; ${new Date().getFullYear()} Aura AI Systems.<br>
        Automated Security & Performance Monitoring
      </p>
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

