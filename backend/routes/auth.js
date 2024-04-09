// routes/auth.js

const express = require("express");
const {
  register,
  login,
  getMe,
  logout,
  verifyOtp,
  forgotPassword,
  resetPassword,
  verifyEmail,
} = require("../controllers/auth");

const router = express.Router();

const { protect } = require("../middleware/auth");

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - telephonenumber
 *               - email
 *               - password
 *               - role
 *             properties:
 *               name:
 *                 type: string
 *               telephonenumber:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *               role:
 *                 type: string
 *     responses:
 *       201:
 *         description: User registered successfully
 */
router.post("/register", register);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login a user
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: User logged in successfully
 *       401:
 *         description: Invalid credentials
 */
router.post("/login", login);

/**
 * @swagger
 * /auth/logout:
 *   get:
 *     summary: Log out the current user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User logged out successfully
 */
router.get("/logout", logout);

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Get current logged in user data
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User data retrieved successfully
 *       401:
 *         description: Unauthorized access
 */
router.get("/me", protect, getMe);

/**
 * @swagger
 * /auth/verifyemail/{verificationToken}:
 *   get:
 *     summary: Verify email
 *     tags: [Authentication]
 *     parameters:
 *       - in: path
 *         name: verificationToken
 *         required: true
 *         description: The verification token received in the email
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Email verified successfully
 *       400:
 *         description: Invalid or expired token
 *       500:
 *         description: Server error
 */
router.get("/verifyemail/:verificationToken", verifyEmail);

/**
 * @swagger
 * /auth/forgotpassword:
 *   post:
 *     summary: Request password reset
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Email sent for password reset
 *       404:
 *         description: User not found with this email
 *       500:
 *         description: Email could not be sent
 */
router.post("/forgotpassword", forgotPassword);

/**
 * @swagger
 * /auth/resetpassword/{resettoken}:
 *   put:
 *     summary: Reset password
 *     tags: [Authentication]
 *     parameters:
 *       - in: path
 *         name: resettoken
 *         required: true
 *         description: The reset token received in the email
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password reset successfully
 *       400:
 *         description: Invalid token
 *       500:
 *         description: Server error
 */
router.put("/resetpassword/:resettoken", resetPassword);

module.exports = router;
