import express from "express";
import bcrypt from "bcrypt";
import User from "../models/user.js";
import { OAuth2Client } from "google-auth-library";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const router = express.Router();

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
    });

    const savedUser = await newUser.save();

    res.status(201).json({ message: "✅ Account created successfully! Now go to login.", user: savedUser });
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

    res.status(200).json({ message: "Login successful", userName: user.userName });
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
        password: sub,
        userType: "user"
      });

      await user.save();
    }

    res.status(200).json({
      message: "Google login successful",
      userName: user.userName,
    });

  } catch (err) {
    console.error("Google login error:", err);
    res.status(400).json({ error: "Google login failed" });
  }
});

export default router;
