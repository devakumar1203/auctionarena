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

module.exports = router;
