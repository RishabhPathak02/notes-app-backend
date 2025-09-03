import express from "express";
import { pool } from "../db.js";
import { authenticateJWT } from "../middleware/auth.js";

const router = express.Router();

// Get tasks
router.get("/", authenticateJWT, async (req, res) => {
  const userId = req.user.userId;
  const q = await pool.query(
    "SELECT id, title, content, status, created_at FROM notes WHERE user_id=$1 ORDER BY created_at DESC",
    [userId]
  );
  res.json(q.rows);
});

// Create task
router.post("/", authenticateJWT, async (req, res) => {
  const { title, content } = req.body;
  const userId = req.user.userId;
  if (!title) return res.status(400).json({ message: "Title required" });

  const q = await pool.query(
    "INSERT INTO notes(user_id, title, content, status) VALUES($1,$2,$3,$4) RETURNING *",
    [userId, title, content|| "", "pending"]
  );
  res.json(q.rows[0]);
});

// Update task
router.put("/:id", authenticateJWT, async (req, res) => {
  const { id } = req.params;
  const { title, content, status } = req.body;
  const userId = req.user.userId;

  const q = await pool.query(
    "UPDATE notes SET title=$1, content=$2, status=$3 WHERE id=$4 AND user_id=$5 RETURNING *",
    [title, content, status, id, userId]
  );
  if (!q.rows.length) return res.status(404).json({ message: "Not found" });

  res.json(q.rows[0]);
});

// Delete task
router.delete("/:id", authenticateJWT, async (req, res) => {
  const { id } = req.params;
  const userId = req.user.userId;

  const q = await pool.query("DELETE FROM notes WHERE id=$1 AND user_id=$2 RETURNING id", [
    id,
    userId,
  ]);
  if (!q.rows.length) return res.status(404).json({ message: "Not found" });

  res.json({ success: true });
});

export default router;
