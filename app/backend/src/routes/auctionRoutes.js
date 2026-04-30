const express = require('express');
const { body } = require('express-validator');
const {
  createAuction,
  getAuctions,
  getAuctionById,
  endAuction,
  getAuctionBids,
  withdrawBid,
  getMyAuctions,
  getMyBids,
  getRatingStatus,
  submitAuctionRating,
} = require('../controllers/auctionController');
const { authenticate } = require('../middlewares/auth');
const validate = require('../middlewares/validate');

const router = express.Router();

router.get('/', getAuctions);

router.get('/my', authenticate, getMyAuctions);

router.get('/my-bids', authenticate, getMyBids);

router.get('/:id', getAuctionById);

router.post(
  '/',
  authenticate,
  [
    body('productId').notEmpty().withMessage('Product ID is required'),
    body('type')
      .isIn(['TIME_BOUND', 'OPEN'])
      .withMessage('Type must be TIME_BOUND or OPEN'),
  ],
  validate,
  createAuction
);

router.post('/:id/end', authenticate, endAuction);

router.get('/:id/bids', getAuctionBids);

router.post('/:id/bid/withdraw', authenticate, withdrawBid);

// Rating endpoints
router.get('/:id/rating-status', authenticate, getRatingStatus);

router.post(
  '/:id/rate',
  authenticate,
  [
    body('score1').isInt({ min: 1, max: 5 }).withMessage('Score must be 1-5'),
    body('score2').isInt({ min: 1, max: 5 }).withMessage('Score must be 1-5'),
    body('comment').trim().isLength({ min: 10 }).withMessage('Comment must be at least 10 characters'),
  ],
  validate,
  submitAuctionRating
);

module.exports = router;
