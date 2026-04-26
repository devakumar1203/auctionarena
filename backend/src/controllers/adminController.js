const prisma = require('../utils/prisma');

// GET /api/admin/dashboard
const getDashboardStats = async (req, res) => {
  try {
    const [totalUsers, blockedUsers, activeAuctions, completedAuctions, totalProducts, flaggedUsers] =
      await Promise.all([
        prisma.user.count({ where: { role: 'USER' } }),
        prisma.user.count({ where: { isBlocked: true } }),
        prisma.auctionRoom.count({ where: { status: 'ACTIVE' } }),
        prisma.auctionRoom.count({ where: { status: 'COMPLETED' } }),
        prisma.product.count(),
        prisma.user.count({ where: { numberOfFlags: { gte: 1 } } }),
      ]);

    res.json({
      stats: {
        totalUsers,
        blockedUsers,
        activeAuctions,
        completedAuctions,
        totalProducts,
        flaggedUsers,
      },
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// GET /api/admin/users
const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, blocked } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = { role: 'USER' };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { pan: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (blocked === 'true') where.isBlocked = true;
    if (blocked === 'false') where.isBlocked = false;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          pan: true,
          phoneNumber: true,
          rating: true,
          numberOfFlags: true,
          isBlocked: true,
          isVerified: true,
          createdAt: true,
          _count: { select: { products: true, bids: true, flagsReceived: true } },
        },
      }),
      prisma.user.count({ where }),
    ]);

    res.json({
      users,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// POST /api/admin/users/:id/block
const toggleBlockUser = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.params.id } });

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }
    if (user.role === 'ADMIN') {
      return res.status(400).json({ message: 'Cannot block an admin.' });
    }

    const updatedUser = await prisma.user.update({
      where: { id: req.params.id },
      data: { isBlocked: !user.isBlocked },
    });

    // Create notification
    await prisma.notification.create({
      data: {
        userId: user.id,
        title: updatedUser.isBlocked ? 'Account Blocked' : 'Account Unblocked',
        message: updatedUser.isBlocked
          ? 'Your account has been blocked by an admin.'
          : 'Your account has been unblocked. You can now use the platform again.',
        type: 'flagged',
      },
    });

    res.json({
      message: `User ${updatedUser.isBlocked ? 'blocked' : 'unblocked'} successfully.`,
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        isBlocked: updatedUser.isBlocked,
      },
    });
  } catch (error) {
    console.error('Toggle block user error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// GET /api/admin/flagged-users
const getFlaggedUsers = async (req, res) => {
  try {
    const flaggedUsers = await prisma.user.findMany({
      where: { numberOfFlags: { gte: 1 } },
      orderBy: { numberOfFlags: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        numberOfFlags: true,
        isBlocked: true,
        rating: true,
        flagsReceived: {
          orderBy: { createdAt: 'desc' },
          include: { author: { select: { id: true, name: true } } },
        },
        commentsReceived: {
          orderBy: { createdAt: 'desc' },
          take: 5,
          include: { author: { select: { id: true, name: true } } },
        },
      },
    });

    res.json({ flaggedUsers });
  } catch (error) {
    console.error('Get flagged users error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// GET /api/admin/auctions
const getAllAuctions = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    if (status) where.status = status;

    const [auctions, total] = await Promise.all([
      prisma.auctionRoom.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          product: true,
          seller: { select: { id: true, name: true, email: true } },
          highestBuyer: { select: { id: true, name: true } },
          _count: { select: { bids: true } },
        },
      }),
      prisma.auctionRoom.count({ where }),
    ]);

    res.json({
      auctions,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Get all auctions error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// DELETE /api/admin/auctions/:id
const removeAuction = async (req, res) => {
  try {
    const auction = await prisma.auctionRoom.findUnique({
      where: { id: req.params.id },
    });

    if (!auction) {
      return res.status(404).json({ message: 'Auction not found.' });
    }

    // Delete all bids first, then the auction
    await prisma.bid.deleteMany({ where: { auctionRoomId: auction.id } });
    await prisma.auctionRoom.delete({ where: { id: auction.id } });

    // Notify seller
    await prisma.notification.create({
      data: {
        userId: auction.sellerId,
        title: 'Auction Removed',
        message: 'Your auction has been removed by an admin for policy violations.',
        type: 'flagged',
      },
    });

    res.json({ message: 'Auction removed successfully.' });
  } catch (error) {
    console.error('Remove auction error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// PUT /api/admin/flags/:id/review
const reviewFlag = async (req, res) => {
  try {
    const flag = await prisma.flag.update({
      where: { id: req.params.id },
      data: { reviewed: true },
    });
    res.json({ message: 'Flag marked as reviewed.', flag });
  } catch (error) {
    console.error('Review flag error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

module.exports = {
  getDashboardStats,
  getAllUsers,
  toggleBlockUser,
  getFlaggedUsers,
  getAllAuctions,
  removeAuction,
  reviewFlag,
};
