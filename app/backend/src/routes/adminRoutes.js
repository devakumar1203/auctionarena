const express = require('express');
const {
  getDashboardStats,
  getAllUsers,
  toggleBlockUser,
  getFlaggedUsers,
  getAllAuctions,
  removeAuction,
  reviewFlag,
} = require('../controllers/adminController');
const { authenticate, authorize } = require('../middlewares/auth');
const { createCategory, deleteCategory } = require('../controllers/categoryController');

const router = express.Router();

// All admin routes require authentication + ADMIN role
router.use(authenticate, authorize('ADMIN'));

router.get('/dashboard', getDashboardStats);
router.get('/users', getAllUsers);
router.post('/users/:id/block', toggleBlockUser);
router.get('/flagged-users', getFlaggedUsers);
router.get('/auctions', getAllAuctions);
router.delete('/auctions/:id', removeAuction);
router.put('/flags/:id/review', reviewFlag);

// Category Management
router.post('/categories', createCategory);
router.delete('/categories/:id', deleteCategory);

module.exports = router;
