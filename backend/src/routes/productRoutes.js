const express = require('express');
const { body } = require('express-validator');
const { createProduct, getProducts, getProductById } = require('../controllers/productController');
const { getAllCategories } = require('../controllers/categoryController');
const { authenticate } = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const upload = require('../middlewares/upload');

const router = express.Router();

router.get('/categories', getAllCategories);

router.get('/', getProducts);

router.get('/:id', getProductById);

// Create product with optional image upload (up to 4 images)
router.post(
  '/',
  authenticate,
  upload.array('images', 4),
  [
    body('name').trim().notEmpty().withMessage('Product name is required'),
    body('description').trim().notEmpty().withMessage('Description is required'),
    body('category').trim().notEmpty().withMessage('Category is required'),
    body('basePrice')
      .isFloat({ min: 1 })
      .withMessage('Base price must be at least 1'),
  ],
  validate,
  createProduct
);

module.exports = router;
