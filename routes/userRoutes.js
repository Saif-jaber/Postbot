import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import multer from "multer";
import path from "path";
import fetch from "node-fetch";
import User from "../models/user.js";
import { OAuth2Client } from "google-auth-library";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const router = express.Router();

// Configure multer for profile picture uploads
const storage = multer.diskStorage({
  destination: './Uploads/profile-pictures',
  filename: (req, file, cb) => {
    cb(null, `${req.userId}-${Date.now()}${path.extname(file.originalname)}`);
  },
});
const upload = multer({ storage });

// Middleware to verify JWT
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Access denied' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (err) {
    res.status(403).json({ error: 'Invalid token' });
  }
};

function generateUniqueUserID() {
  return 'U' + Math.floor(Math.random() * 9000000000 + 1000000000);
}

async function generateNonDuplicateUserID() {
  let userID;
  let exists = true;
  while (exists) {
    userID = generateUniqueUserID();
    const user = await User.findOne({ userID });
    if (!user) exists = false;
  }
  return userID;
}

router.post("/register", async (req, res) => {
  try {
    const { userName, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(409).json({ error: "Email is already in use." });

    const existingUserName = await User.findOne({ userName });
    if (existingUserName) return res.status(409).json({ error: "Username is already taken." });

    const hashedPassword = await bcrypt.hash(password, 10);
    const userID = await generateNonDuplicateUserID();

    const newUser = new User({
      userID,
      userName,
      email,
      password: hashedPassword,
      userType: "user",
      profilePicture: "images/profile-user.png",
    });

    const savedUser = await newUser.save();

    const token = jwt.sign({ userId: savedUser._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.status(201).json({
      message: "✅ Account created successfully!",
      user: { userID: savedUser.userID, userName: savedUser.userName, email: savedUser.email, profilePicture: savedUser.profilePicture },
      token,
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ error: "Incorrect password" });

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.status(200).json({
      message: "Login successful",
      user: { userID: user.userID, userName: user.userName, email: user.email, profilePicture: user.profilePicture },
      token,
    });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/google-login", async (req, res) => {
  const { credential } = req.body;

  try {
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { email, name, sub } = payload;

    let user = await User.findOne({ email });

    if (!user) {
      const userID = await generateNonDuplicateUserID();
      user = new User({
        userID,
        userName: name,
        email,
        password: await bcrypt.hash(sub, 10),
        userType: "user",
        profilePicture: "images/profile-user.png",
      });
      await user.save();
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.status(200).json({
      message: "Google login successful",
      user: { userID: user.userID, userName: user.userName, email: user.email, profilePicture: user.profilePicture },
      token,
    });
  } catch (err) {
    console.error("Google login error:", err);
    res.status(400).json({ error: "Google login failed" });
  }
});

router.get("/user", authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post("/user/profile-picture", authenticateToken, upload.single('profilePicture'), async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    user.profilePicture = `/Uploads/profile-pictures/${req.file.filename}`;
    await user.save();
    res.json({ profilePicture: user.profilePicture });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// New route to handle image downloads
router.post("/download-image", authenticateToken, async (req, res) => {
  const { imageUrl } = req.body;
  if (!imageUrl) {
    return res.status(400).json({ error: 'Image URL is required' });
  }

  try {
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }
    const buffer = await response.buffer();
    res.set({
      'Content-Type': response.headers.get('content-type') || 'image/png',
      'Content-Disposition': `attachment; filename="generated-image-${Date.now()}.png"`,
    });
    res.send(buffer);
  } catch (err) {
    console.error('Backend download error:', err);
    res.status(500).json({ error: `Failed to download image: ${err.message}` });
  }
});

export default router;