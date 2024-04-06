// controllers/auth.js
const User = require("../models/User");
const nodemailer = require("nodemailer");

// Helper function to send OTP via email
async function sendOtpEmail(user, otp) {
  // Configure your SMTP transporter
  let transporter = nodemailer.createTransport({
    // Example with Gmail; use your preferred service
    service: "gmail",
    auth: {
      user: "hotelbookingswdev@gmail.com", // replace with your email
      pass: "cjqwklusnxnrzkyd", // replace with your email password
    },
  });

  // Send mail with defined transport object
  let info = await transporter.sendMail({
    from: '"Hotel Booking JODQ" <hotelbookingswdev@gmail.com>', // sender address
    to: user.email, // list of receivers
    subject: "OTP for Email Verification", // Subject line
    text: `Your OTP is ${otp}`, // plain text body
  });

  console.log("Message sent: %s", info.messageId);
}

// @desc    Verify OTP
// @route   POST /api/v1/auth/verify-otp
// @access  Public
exports.verifyOtp = async (req, res, next) => {
  const { email, otp } = req.body;

  try {
    const user = await User.findOne({
      email,
      otp,
      otpExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res
        .status(400)
        .json({ success: false, msg: "Invalid or expired OTP" });
    }

    // OTP is valid, remove otp and otpExpire from user
    user.isEmailVerified = true;
    user.otp = undefined;
    user.otpExpire = undefined;
    await user.save();

    res
      .status(200)
      .json({ success: true, message: "Email verified successfully" });
  } catch (err) {
    console.error("Error during OTP verification:", err); // Enhanced error logging
    res.status(500).json({ success: false, msg: "Server error" });
  }
};

// @desc    Register user
// @route   POST /api/v1/auth/register
// @access  Public
exports.register = async (req, res, next) => {
  try {
    const { name, telephonenumber, email, password, role } = req.body;

    // Create user
    const user = await User.create({
      name,
      telephonenumber,
      email,
      password,
      role,
    });

    // Generate OTP and set expiration
    const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6 digit OTP
    user.otp = otp;
    user.otpExpire = Date.now() + 10 * 60 * 1000; // OTP expires in 10 minutes

    await user.save();

    // Send OTP via email
    await sendOtpEmail(user, otp);

    // Send token response
    sendTokenResponse(user, 200, res);
  } catch (err) {
    res.status(400).json({ success: false });
    console.log(err.stack);
  }
};

//@desc Login user
//@route POST /api/v1/auth/login
//@access Public
exports.login = async (req, res, next) => {
  const { email, password } = req.body;

  console.log(`Attempting to log in with email: ${email}`);

  try {
    const user = await User.findOne({ email }).select("+password");
    console.log("user:", user);

    if (!user) {
      return res
        .status(400)
        .json({ success: false, msg: "Invalid credentials" });
    }

    console.log(
      `User found: ${user.email}, isEmailVerified: ${user.isEmailVerified}`
    );

    if (!user.isEmailVerified) {
      return res.status(401).json({
        success: false,
        msg: "Please verify your email before logging in",
      });
    }

    const isMatch = await user.matchPassword(password);
    console.log("password: ", password);

    console.log(`Password match: ${isMatch}`);

    if (!isMatch) {
      return res
        .status(401)
        .json({ success: false, msg: "Password not match credentials" });
    }

    sendTokenResponse(user, 200, res);
  } catch (error) {
    console.error(`Login error: ${error.message}`);
    res.status(500).json({ success: false, msg: "Server error" });
  }
};

// Get token from model, create cookie and send response
const sendTokenResponse = (user, statusCode, res) => {
  // Create token
  const token = user.getSignedJwtToken();

  const options = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };

  if (process.env.NODE_ENV === "production") {
    options.secure = true;
  }

  res.status(statusCode).cookie("token", token, options).json({
    success: true,
    //add for frontend
    _id: user._id,
    name: user.name,
    email: user.email,
    //end for frontend
    token,
  });
};

// At the end of file
// @desc Get current logged in user
// @route POST /api/v1/auth/me
// @access Private
exports.getMe = async (req, res, next) => {
  const user = await User.findById(req.user.id);
  res.status(200).json({
    success: true,
    data: user,
  });
};

//@desc Log user out / clear cookie
//@route GET /api/v1/auth/logout
//@access Private
exports.logout = async (req, res, next) => {
  res.cookie("token", "none", {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });

  res.status(200).json({
    success: true,
    data: {},
  });
};
