const prisma = require('../utils/prisma');
const { sendNewItemInCategoryEmail } = require('../services/emailService');

// POST /api/products
const createProduct = async (req, res) => {
  try {
    const { name, description, category, basePrice } = req.body;

    // Build image URLs from uploaded files
    const images = (req.files || []).map(
      (f) => `/uploads/${f.filename}`
    );

    const product = await prisma.product.create({
      data: {
        name,
        description,
        category,
        basePrice: parseFloat(basePrice),
        images,
        sellerId: req.user.id,
      },
      include: { seller: { select: { id: true, name: true, rating: true } } },
    });

    // Notify users who have this category as favorite
    const interestedUsers = await prisma.user.findMany({
      where: {
        favoriteCategories: { has: category },
        id: { not: req.user.id },
        isBlocked: false,
      },
      select: { email: true },
    });

    for (const user of interestedUsers) {
      await sendNewItemInCategoryEmail(user.email, { name, category, basePrice });
    }

    res.status(201).json({ message: 'Product created successfully.', product });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// GET /api/products
const getProducts = async (req, res) => {
  try {
    const { search, category, page = 1, limit = 12, sort = 'latest' } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (category) {
      where.category = category;
    }

    let orderBy = { createdAt: 'desc' };
    if (sort === 'price_asc') orderBy = { basePrice: 'asc' };
    if (sort === 'price_desc') orderBy = { basePrice: 'desc' };

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy,
        skip,
        take: parseInt(limit),
        include: {
          seller: { select: { id: true, name: true, rating: true } },
          auction: { select: { id: true, status: true, bestPrice: true, type: true, endTime: true } },
        },
      }),
      prisma.product.count({ where }),
    ]);

    res.json({
      products,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// GET /api/products/:id
const getProductById = async (req, res) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: req.params.id },
      include: {
        seller: { select: { id: true, name: true, rating: true, ratingCount: true } },
        auction: {
          include: {
            bids: {
              orderBy: { createdAt: 'desc' },
              take: 20,
              include: { user: { select: { id: true, name: true } } },
            },
          },
        },
      },
    });

    if (!product) {
      return res.status(404).json({ message: 'Product not found.' });
    }

    res.json({ product });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// GET /api/products/categories
const getCategories = async (req, res) => {
  try {
    const categories = await prisma.product.findMany({
      select: { category: true },
      distinct: ['category'],
    });
    res.json({ categories: categories.map((c) => c.category) });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

module.exports = { createProduct, getProducts, getProductById, getCategories };
