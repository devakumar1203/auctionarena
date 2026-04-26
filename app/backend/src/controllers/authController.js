const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const prisma = require('../utils/prisma');
const generateToken = require('../utils/generateToken');
const { sendVerificationEmail, sendWelcomeEmail, sendPasswordResetEmail } = require('../services/emailService');

// POST /api/auth/register
const register = async (req, res) => {
  try {
    const { name, email, password, pan, phoneNumber } = req.body;

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { pan }, { phoneNumber }],
      },
    });

    if (existingUser) {
      let field = 'Email';
      if (existingUser.pan === pan) field = 'PAN';
      if (existingUser.phoneNumber === phoneNumber) field = 'Phone number';
      return res.status(400).json({ message: `${field} is already registered.` });
    }

    // Hash password
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Generate verification token
    const verifyToken = crypto.randomBytes(32).toString('hex');

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        pan,
        phoneNumber,
        verifyToken,
      },
    });

    // Send verification email only — welcome email will be sent after verification
    await sendVerificationEmail(email, verifyToken);

    res.status(201).json({
      message: 'Registration successful. Please check your email to verify your account.',
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// POST /api/auth/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    if (user.isBlocked) {
      return res.status(403).json({
        message: 'Your account has been blocked due to policy violations. Contact admin.',
      });
    }

    // Block login for unverified users
    if (!user.isVerified) {
      return res.status(403).json({
        message: 'Please verify your email before logging in. Check your inbox for the verification link.',
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const token = generateToken(user);

    res.json({
      message: 'Login successful.',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        rating: user.rating,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// GET /api/auth/verify-email?token=xxx
const verifyEmail = async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({ message: 'Verification token is required.' });
    }

    const user = await prisma.user.findFirst({
      where: { verifyToken: token },
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired verification token.' });
    }

    if (user.isVerified) {
      return res.json({ message: 'Email is already verified.' });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { isVerified: true, verifyToken: null },
    });

    // Send welcome email now that the user is verified
    await sendWelcomeEmail(user.email, user.name);

    res.json({ message: 'Email verified successfully! You can now log in.' });
  } catch (error) {
    console.error('Verify email error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// POST /api/auth/forgot-password
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      // Don't reveal whether the email exists — always return success
      return res.json({ message: 'If an account with that email exists, a password reset link has been sent.' });
    }

    // Generate reset token with 1-hour expiry
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.user.update({
      where: { id: user.id },
      data: { resetToken, resetTokenExpiry },
    });

    await sendPasswordResetEmail(email, resetToken);

    res.json({ message: 'If an account with that email exists, a password reset link has been sent.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// POST /api/auth/reset-password
const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: { gte: new Date() },
      },
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired reset token. Please request a new one.' });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
        // Clicking the email link proves ownership — also verify the email
        isVerified: true,
        verifyToken: null,
      },
    });

    res.json({ message: 'Password has been reset successfully. You can now log in with your new password.' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// GET /api/auth/me
const getMe = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        pan: true,
        phoneNumber: true,
        role: true,
        rating: true,
        ratingCount: true,
        numberOfFlags: true,
        isVerified: true,
        isBlocked: true,
        favoriteCategories: true,
        createdAt: true,
      },
    });
    res.json({ user });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

module.exports = { register, login, verifyEmail, getMe, forgotPassword, resetPassword };
