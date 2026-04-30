const prisma = require('../utils/prisma');

// GET /api/categories
const getAllCategories = async (req, res) => {
  try {
    // Get admin-managed categories
    const adminCategories = await prisma.category.findMany({
      orderBy: { name: 'asc' },
    });
    const adminNames = adminCategories.map(c => c.name);

    // Get distinct categories from existing products
    const productCategories = await prisma.product.findMany({
      select: { category: true },
      distinct: ['category'],
    });
    const productNames = productCategories.map(c => c.category);

    // Merge and deduplicate
    const allNames = [...new Set([...adminNames, ...productNames])].sort();

    res.json({ categories: allNames, fullCategories: adminCategories });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// POST /api/admin/categories
const createCategory = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || name.trim() === '') {
      return res.status(400).json({ message: 'Category name is required.' });
    }

    const category = await prisma.category.create({
      data: { name: name.trim() },
    });

    res.status(201).json({ message: 'Category created successfully.', category });
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({ message: 'Category already exists.' });
    }
    console.error('Create category error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// DELETE /api/admin/categories/:id
const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.category.delete({
      where: { id },
    });
    res.json({ message: 'Category deleted successfully.' });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Category not found.' });
    }
    console.error('Delete category error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

module.exports = { getAllCategories, createCategory, deleteCategory };
