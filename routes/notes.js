import express from "express";
import { pool } from "../db.js";
import { authenticateJWT } from "../middleware/auth.js";

const router = express.Router();

// CREATE
router.post("/", authenticateJWT, async (req, res) => {
  const { title, content } = req.body;
  try {
    const result = await pool.query(
      "INSERT INTO notes (user_id, title, content) VALUES ($1, $2, $3) RETURNING id, title, content",
      [req.user.userId, title, content]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Create note error:", err);
    res.status(500).json({ error: "Failed to create note" });
  }
});

// READ
router.get("/", authenticateJWT, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, title, content AS content FROM notes WHERE user_id = $1",
      [req.user.userId]
    );
    // console.log("fetch notes : ",result.rows);
    res.json(result.rows);
  } catch (err) {
    console.error("Fetch notes error:", err);
    res.status(500).json({ error: "Failed to fetch notes" });
  }
});

// UPDATE
router.put("/:id", authenticateJWT, async (req, res) => {
  const { id } = req.params;
  const { title, content } = req.body;
  try {
    const result = await pool.query(
      "UPDATE notes SET title = $1, content = $2 WHERE id = $3 AND user_id = $4 RETURNING id, title, content ",
      [title, content, id, req.user.userId]
    );
    if (!result.rows.length) return res.status(404).json({ error: "Note not found" });
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Update error:", err);
    res.status(500).json({ error: "Failed to update note" });
  }
});

// DELETE
router.delete("/:id", authenticateJWT, async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query("DELETE FROM notes WHERE id = $1 AND user_id = $2", [id, req.user.userId]);
    res.json({ success: true });
  } catch (err) {
    console.error("Delete error:", err);
    res.status(500).json({ error: "Failed to delete note" });
  }
});

export default router;
