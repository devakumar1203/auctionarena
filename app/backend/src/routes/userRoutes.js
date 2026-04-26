const express = require('express');
const { body } = require('express-validator');
const {
  getUserProfile,
  updateProfile,
  flagUser,
  rateUser,
  addComment,
  getComments,
  getNotifications,
  markNotificationRead,
} = require('../controllers/userController');
const { authenticate } = require('../middlewares/auth');
const validate = require('../middlewares/validate');

const router = express.Router();

router.get('/notifications', authenticate, getNotifications);
router.put('/notifications/:id/read', authenticate, markNotificationRead);

router.get('/profile/:id', getUserProfile);

router.put(
  '/profile',
  authenticate,
  [body('name').optional().trim().notEmpty().withMessage('Name cannot be empty')],
  validate,
  updateProfile
);

router.post(
  '/:id/flag',
  authenticate,
  [body('reason').trim().notEmpty().withMessage('Reason is required')],
  validate,
  flagUser
);

router.post(
  '/:id/rate',
  authenticate,
  [
    body('productQuality')
      .isInt({ min: 1, max: 5 })
      .withMessage('Product quality must be 1-5'),
    body('descriptionAccuracy')
      .isInt({ min: 1, max: 5 })
      .withMessage('Description accuracy must be 1-5'),
    body('auctionId').notEmpty().withMessage('Auction ID is required'),
  ],
  validate,
  rateUser
);

router.post(
  '/:id/comments',
  authenticate,
  [body('content').trim().notEmpty().withMessage('Comment cannot be empty')],
  validate,
  addComment
);

router.get('/:id/comments', getComments);

module.exports = router;
