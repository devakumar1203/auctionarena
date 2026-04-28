const prisma = require('../utils/prisma');

// GET /api/users/profile/:id
const getUserProfile = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
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
        isBlocked: true,
        isVerified: true,
        favoriteCategories: true,
        createdAt: true,
        _count: {
          select: {
            products: true,
            auctions: true,
            bids: true,
            wonAuctions: true,
          },
        },
        commentsReceived: {
          orderBy: { createdAt: 'desc' },
          take: 20,
          include: { author: { select: { id: true, name: true } } },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// PUT /api/users/profile
const updateProfile = async (req, res) => {
  try {
    const { name, phoneNumber, favoriteCategories } = req.body;

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        ...(name && { name }),
        ...(phoneNumber && { phoneNumber }),
        ...(favoriteCategories && { favoriteCategories }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        phoneNumber: true,
        favoriteCategories: true,
        rating: true,
      },
    });

    res.json({ message: 'Profile updated.', user });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// POST /api/users/:id/flag
const flagUser = async (req, res) => {
  try {
    const { reason } = req.body;
    const targetId = req.params.id;

    if (targetId === req.user.id) {
      return res.status(400).json({ message: 'You cannot flag yourself.' });
    }

    const target = await prisma.user.findUnique({ where: { id: targetId } });
    if (!target) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Create flag
    await prisma.flag.create({
      data: {
        reason,
        authorId: req.user.id,
        targetId,
      },
    });

    // Increment flag count
    const updatedUser = await prisma.user.update({
      where: { id: targetId },
      data: { numberOfFlags: { increment: 1 } },
    });

    // Three-strike penalty: auto-block
    if (updatedUser.numberOfFlags >= 3) {
      await prisma.user.update({
        where: { id: targetId },
        data: { isBlocked: true },
      });

      // Notify admin
      await prisma.notification.create({
        data: {
          userId: targetId,
          title: 'Account Blocked',
          message: 'Your account has been blocked due to receiving 3 flags. An admin will review your case.',
          type: 'flagged',
        },
      });
    }

    res.json({
      message: 'User flagged successfully.',
      totalFlags: updatedUser.numberOfFlags,
    });
  } catch (error) {
    console.error('Flag user error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// POST /api/users/:id/rate
const rateUser = async (req, res) => {
  try {
    const { productQuality, descriptionAccuracy, auctionId } = req.body;
    const targetId = req.params.id;

    if (targetId === req.user.id) {
      return res.status(400).json({ message: 'You cannot rate yourself.' });
    }

    // Check if already rated for this auction
    const existingRating = await prisma.rating.findFirst({
      where: {
        authorId: req.user.id,
        targetId,
        auctionId,
      },
    });

    if (existingRating) {
      return res.status(400).json({ message: 'You have already rated this seller for this auction.' });
    }

    const overallScore = (productQuality + descriptionAccuracy) / 2;

    await prisma.rating.create({
      data: {
        productQuality,
        descriptionAccuracy,
        overallScore,
        authorId: req.user.id,
        targetId,
        auctionId,
      },
    });

    // Recalculate average rating
    const target = await prisma.user.findUnique({ where: { id: targetId } });
    const newRatingCount = target.ratingCount + 1;
    const newRating =
      (target.rating * target.ratingCount + overallScore) / newRatingCount;

    await prisma.user.update({
      where: { id: targetId },
      data: {
        rating: Math.round(newRating * 10) / 10,
        ratingCount: newRatingCount,
      },
    });

    res.json({ message: 'Rating submitted.', rating: newRating });
  } catch (error) {
    console.error('Rate user error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// POST /api/users/:id/comments
const addComment = async (req, res) => {
  try {
    const { content } = req.body;
    const targetId = req.params.id;

    if (targetId === req.user.id) {
      return res.status(400).json({ message: 'You cannot comment on your own profile.' });
    }

    const comment = await prisma.comment.create({
      data: {
        content,
        authorId: req.user.id,
        targetId,
      },
      include: { author: { select: { id: true, name: true } } },
    });

    res.status(201).json({ message: 'Comment added.', comment });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// GET /api/users/:id/comments
const getComments = async (req, res) => {
  try {
    const comments = await prisma.comment.findMany({
      where: { targetId: req.params.id },
      orderBy: { createdAt: 'desc' },
      include: { author: { select: { id: true, name: true } } },
    });
    res.json({ comments });
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// GET /api/users/notifications
const getNotifications = async (req, res) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    res.json({ notifications });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// PUT /api/users/notifications/:id/read
const markNotificationRead = async (req, res) => {
  try {
    await prisma.notification.update({
      where: { id: req.params.id },
      data: { read: true },
    });
    res.json({ message: 'Notification marked as read.' });
  } catch (error) {
    console.error('Mark notification read error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// GET /api/users/category-subscriptions
const getCategorySubscriptions = async (req, res) => {
  try {
    const subscriptions = await prisma.categorySubscription.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ subscriptions, categories: subscriptions.map(s => s.category) });
  } catch (error) {
    console.error('Get category subscriptions error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// POST /api/users/category-subscriptions
const subscribeToCategory = async (req, res) => {
  try {
    const { category } = req.body;
    if (!category || !category.trim()) {
      return res.status(400).json({ message: 'Category is required.' });
    }

    const subscription = await prisma.categorySubscription.create({
      data: {
        userId: req.user.id,
        category: category.trim(),
      },
    });

    res.status(201).json({ message: `Subscribed to "${category}" notifications.`, subscription });
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({ message: 'Already subscribed to this category.' });
    }
    console.error('Subscribe to category error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// DELETE /api/users/category-subscriptions/:category
const unsubscribeFromCategory = async (req, res) => {
  try {
    const category = decodeURIComponent(req.params.category);
    await prisma.categorySubscription.deleteMany({
      where: {
        userId: req.user.id,
        category,
      },
    });
    res.json({ message: `Unsubscribed from "${category}" notifications.` });
  } catch (error) {
    console.error('Unsubscribe from category error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

module.exports = {
  getUserProfile,
  updateProfile,
  flagUser,
  rateUser,
  addComment,
  getComments,
  getNotifications,
  markNotificationRead,
  getCategorySubscriptions,
  subscribeToCategory,
  unsubscribeFromCategory,
};
