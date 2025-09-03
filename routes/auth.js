import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { pool } from "../db.js";

const router = express.Router();

router.post("/register", async (req, res) => {
  const { username, password } = req.body;

  // Basic validation
  if (!username || !password) {
    return res.status(400).json({ error: "Username and password are required" });
  }

  try {
    // Check if username already exists
    const existingUser = await pool.query(
      "SELECT id FROM users WHERE username = $1",
      [username]
    );
    if (existingUser.rows.length > 0) {
      return res.status(409).json({ error: "Username already taken" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert new user
    const result = await pool.query(
      "INSERT INTO users (username, password_hash) VALUES ($1, $2) RETURNING id, username, created_at",
      [username, hashedPassword]
    );

    res.status(201).json({
      message: "User registered successfully",
      user: result.rows[0],
    });
  } catch (err) {
    console.error("Register error details:", err); // Full error in console
    res.status(500).json({ error: err.message }); 
  }
});

// ==================== LOGIN ====================
router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  // Basic validation
  if (!username || !password) {
    return res.status(400).json({ error: "Username and password are required" });
  }

  try {
    // Find user by username
    const result = await pool.query(
      "SELECT * FROM users WHERE username = $1",
      [username]
    );
    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    const user = result.rows[0];

    // Compare entered password with stored hash
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    // Check for JWT secret in env
    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET is missing in environment variables");
      return res.status(500).json({ error: "Server misconfiguration" });
    }

    // Generate JWT
    const token = jwt.sign(
      { userId: user.id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
    
    res.json({
      message: "Login successful",
      token,
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Login failed due to server error" });
  }
});

export default router;
