// routes/userRoutes.js
import express from "express";
import bcrypt from "bcrypt";
import User from "../models/user.js";

const router = express.Router();

function generateUniqueUserID() {
  return 'U' + Math.floor(Math.random() * 9000000000 + 1000000000); // 10 digit number after 'U'
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

// ========== REGISTER ==========
router.post("/register", async (req, res) => {
  try {
    const { userName, email, password } = req.body;

    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ error: "Email is already in use." });
    }

    // Check if userName already exists
    const existingUserName = await User.findOne({ userName });
    if (existingUserName) {
      return res.status(409).json({ error: "Username is already taken." });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate unique userID
    const userID = await generateNonDuplicateUserID();

    // Create new user
    const newUser = new User({
      userID,
      userName,
      email,
      password: hashedPassword,
      userType: "user"
    });

    const savedUser = await newUser.save();


    res.status(201).json({ message: "✅ Account created successfully! Now go to login.", user: savedUser });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ========== LOGIN ==========
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Incorrect password" });
    }

    res.status(200).json({ 
      message: "Login successful", 
      userName: user.userName // send userName to frontend
    });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
