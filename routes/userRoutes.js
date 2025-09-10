import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import multer from "multer";
import path from "path";
import User from "../models/user.js";
import { OAuth2Client } from "google-auth-library";
import fetch from 'node-fetch'; // Add node-fetch for compatibility

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

router.post("/download-image", authenticateToken, async (req, res) => {
  const { imageUrl } = req.body;
  if (!imageUrl) {
    console.error('No imageUrl provided in request body');
    return res.status(400).json({ error: 'Image URL is required' });
  }

  // Validate imageUrl format
  if (!imageUrl.startsWith('https://pollinations.ai/p/')) {
    console.error('Invalid image URL:', imageUrl);
    return res.status(400).json({ error: 'Invalid image URL. Must be a pollinations.ai URL' });
  }

  console.log('Fetching image from:', imageUrl); // Debug log

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10-second timeout

    const response = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Postbot/1.0)',
        'Accept': 'image/*',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error('Failed to fetch image from pollinations.ai:', response.status, response.statusText);
      throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
    }

    const contentType = response.headers.get('content-type') || 'image/png';
    if (!contentType.startsWith('image/')) {
      console.error('Invalid content type received:', contentType);
      throw new Error('Response is not an image');
    }

    // Buffer the entire response instead of streaming
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    if (buffer.length === 0) {
      console.error('Empty image buffer received');
      throw new Error('Empty image data received');
    }

    const extension = contentType.split('/')[1] || 'png';
    res.set({
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="generated-image-${Date.now()}.${extension}"`,
      'Content-Length': buffer.length,
    });

    res.send(buffer);
  } catch (err) {
    console.error('Download image error:', err.message, err.stack);
    if (err.name === 'AbortError') {
      res.status(504).json({ error: 'Request timed out while fetching image' });
    } else {
      res.status(500).json({ error: `Failed to download image: ${err.message}` });
    }
  }
});

export default router;