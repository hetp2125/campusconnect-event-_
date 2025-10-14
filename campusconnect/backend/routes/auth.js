const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const auth = require("../middleware/auth");
const router = express.Router();


router.post("/register-student", async (req, res) => {
  const { name, email, collegeId, password } = req.body;
  const passwordHash = await bcrypt.hash(password, 10);
  const user = new User({
    name,
    email,
    collegeId,
    passwordHash,
    role: "student",
  });
  await user.save();
  res.json({ message: "Student registered" });
});

// Admin registration (for demo)
router.post("/register-admin", async (req, res) => {
  const { name, email, password, adminCode } = req.body;
  if (adminCode !== process.env.ADMIN_CODE)
    return res.status(401).json({ error: "Invalid admin code" });
  const passwordHash = await bcrypt.hash(password, 10);
  const user = new User({ name, email, passwordHash, role: "admin" });
  await user.save();
  res.json({ message: "Admin registered" });
});

// Student login
router.post("/student-login", async (req, res) => {
  const { email, collegeId, password } = req.body;
  const user = await User.findOne({ email, collegeId, role: "student" });
  if (!user || !(await user.comparePassword(password)))
    return res.status(401).json({ error: "Invalid credentials" });

  const token = jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "1d" },
  );
  res.json({ token, role: user.role });
});

// Admin login
router.post("/admin-login", async (req, res) => {
  const { email, password, adminCode } = req.body;
  if (adminCode !== process.env.ADMIN_CODE)
    return res.status(401).json({ error: "Invalid admin code" });

  const user = await User.findOne({ email, role: "admin" });
  if (!user || !(await user.comparePassword(password)))
    return res.status(401).json({ error: "Invalid credentials" });

  const token = jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "1d" },
  );
  res.json({ token, role: user.role });
});

router.get("/me", auth, async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) return res.status(404).json({ error: "User not found" });

  // Convert registeredEvents ObjectIds to strings for frontend
  const registeredEventIds = user.registeredEvents.map((eventId) =>
    eventId.toString(),
  );

  res.json({
    name: user.name,
    email: user.email,
    collegeId: user.collegeId,
    role: user.role,
    registeredEvents: registeredEventIds,
  });
});

module.exports = router;
