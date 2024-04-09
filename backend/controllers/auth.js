const User = require("../models/User");
const nodemailer = require("nodemailer");
const crypto = require("crypto");

async function sendVerificationEmail(user, verificationUrl) {
  // SMTP configuration and email sending logic
  let transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "hotelbookingswdev@gmail.com", // replace with your email
      pass: "cjqwklusnxnrzkyd", // replace with your email password
    },
  });

  // Email content
  const message = `You are receiving this email because you have registered an account. Please verify your email by clicking on the following link: ${verificationUrl}`;

  await transporter.sendMail({
    from: '"Hotel Booking JOD-Q" <hotelbookingswdev@gmail.com>', // sender address    to: user.email, // receiver (user's email)
    to: user.email, // list of receivers
    subject: "Email Verification", // subject line
    text: message, // plain text body
  });
}

async function sendResetPasswordEmail(user, resetUrl) {
  // Configure your SMTP transporter
  let transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "hotelbookingswdev@gmail.com", // replace with your email
      pass: "cjqwklusnxnrzkyd", // replace with your email password
    },
  });

  // Email content
  const message = `You are receiving this email because you (or someone else) have requested the reset of a password. Please click on the following link, or paste it into your browser to complete the process:\n\n${resetUrl}\n\nIf you did not request this, please ignore this email and your password will remain unchanged.`;

  // Send email
  let info = await transporter.sendMail({
    from: '"Hotel Booking JOD-Q" <hotelbookingswdev@gmail.com>', // sender address
    to: user.email, // list of receivers
    subject: "Password Reset Link", // Subject line
    text: message, // plain text body
  });

  console.log("Password reset email sent: %s", info.messageId);
}

// @desc    Forgot Password
// @route   POST /api/v1/auth/forgotpassword
// @access  Public
exports.forgotPassword = async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.body.email });

    if (!user) {
      return res
        .status(404)
        .json({ success: false, msg: "User not found with this email" });
    }

    // Get reset token
    const resetToken = user.getResetPasswordToken();
    await user.save({ validateBeforeSave: false });

    // Create reset url
    const resetUrl = `${req.protocol}://${req.get(
      "host"
    )}/api/v1/auth/resetpassword/${resetToken}`;

    const message = `You are receiving this email because you (or someone else) has requested the reset of a password. Please make a PUT request to: \n\n ${resetUrl}`;

    try {
      await sendResetPasswordEmail(user, resetUrl);
      res.status(200).json({ success: true, data: "Email sent" });
    } catch (err) {
      console.error(err);
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save({ validateBeforeSave: false });
      res.status(500).json({ success: false, msg: "Email could not be sent" });
    }
  } catch (error) {
    res.status(500).json({ success: false, msg: "Server error" });
  }
};

// @desc    Reset Password
// @route   PUT /api/v1/auth/resetpassword/:resettoken
// @access  Public
exports.resetPassword = async (req, res, next) => {
  try {
    // Convert received token to hash
    const resetPasswordToken = crypto
      .createHash("sha256")
      .update(req.params.resettoken)
      .digest("hex");

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ success: false, msg: "Invalid token" });
    }

    // Set new password and clear reset token fields
    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res
      .status(200)
      .json({ success: true, data: "Password reset successfully" });
  } catch (error) {
    console.error(`Reset Password error: ${error.message}`);
    res.status(500).json({ success: false, msg: "Server error" });
  }
};

exports.verifyEmail = async (req, res, next) => {
  try {
    // Hash the verification token sent by the user
    const verificationToken = crypto
      .createHash("sha256")
      .update(req.params.verificationToken)
      .digest("hex");

    // Find the user by the hashed verification token and ensure it's not expired
    console.log(verificationToken);
    const user = await User.findOne({
      emailVerificationToken: verificationToken,
      emailVerificationTokenExpire: { $gt: Date.now() }, // Ensure token is not expired
    });

    // If user is not found or token is expired, respond with an error
    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid or expired token" });
    }

    // If the user is found and token is valid, mark the email as verified
    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationTokenExpire = undefined;
    await user.save();

    // Respond with success message
    res
      .status(200)
      .json({ success: true, message: "Email verified successfully" });
  } catch (error) {
    // Handle any errors that occur during the verification process
    console.error("Error verifying email:", error);
    res.status(500).json({ success: false, message: "Server error" });
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

    // Generate verification token
    const verificationToken = user.getVerificationToken();
    await user.save({ validateBeforeSave: false });

    // Create verification URL
    const verificationUrl = `${req.protocol}://${req.get(
      "host"
    )}/api/v1/auth/verifyemail/${verificationToken}`;

    // Send verification email
    await sendVerificationEmail(user, verificationUrl);

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
