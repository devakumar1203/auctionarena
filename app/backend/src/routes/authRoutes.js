const express = require('express');
const { body } = require('express-validator');
const { register, login, verifyEmail, getMe } = require('../controllers/authController');
const { authenticate } = require('../middlewares/auth');
const validate = require('../middlewares/validate');

const router = express.Router();

router.post(
  '/register',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password')
      .isStrongPassword({
        minLength: 8,
        minLowercase: 1,
        minUppercase: 1,
        minNumbers: 1,
        minSymbols: 1,
      })
      .withMessage('Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
    body('pan')
      .trim()
      .notEmpty()
      .withMessage('PAN is required')
      .isLength({ min: 10, max: 10 })
      .withMessage('PAN must be 10 characters'),
    body('phoneNumber')
      .trim()
      .notEmpty()
      .withMessage('Phone number is required')
      .isLength({ min: 10, max: 10 })
      .withMessage('Phone number must be exactly 10 digits'),
  ],
  validate,
  register
);

router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  validate,
  login
);

router.post('/verify-email', verifyEmail);

router.get('/me', authenticate, getMe);

module.exports = router;
