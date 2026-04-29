const prisma = require('../utils/prisma');
const { getIO } = require('../utils/socketInstance');
const {
  sendAuctionWonEmailToBuyer,
  sendAuctionSoldEmailToSeller,
  sendAuctionNoBidsEmail,
} = require('../services/emailService');

// POST /api/auctions
const createAuction = async (req, res) => {
  try {
    const { productId, type, endTime } = req.body;

    // Verify seller owns the product
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { auction: true },
    });

    if (!product) {
      return res.status(404).json({ message: 'Product not found.' });
    }
    if (product.sellerId !== req.user.id) {
      return res.status(403).json({ message: 'You can only create auctions for your own products.' });
    }
    if (product.auction) {
      return res.status(400).json({ message: 'An auction already exists for this product.' });
    }

    if (type === 'TIME_BOUND' && !endTime) {
      return res.status(400).json({ message: 'End time is required for time-bound auctions.' });
    }

    if (type === 'TIME_BOUND' && new Date(endTime) <= new Date()) {
      return res.status(400).json({ message: 'End time must be in the future.' });
    }

    const auction = await prisma.auctionRoom.create({
      data: {
        productId,
        sellerId: req.user.id,
        type,
        endTime: type === 'TIME_BOUND' ? new Date(endTime) : null,
        bestPrice: product.basePrice,
      },
      include: {
        product: true,
      },
    });

    // --- Notify users subscribed to this product's category ---
    try {
      const subscribers = await prisma.categorySubscription.findMany({
        where: {
          category: product.category,
          userId: { not: req.user.id }, // exclude the seller
        },
        select: { userId: true },
      });

      if (subscribers.length > 0) {
        const notificationData = subscribers.map(sub => ({
          userId: sub.userId,
          title: `New auction in "${product.category}"`,
          message: `"${product.name}" is now up for bidding at ₹${product.basePrice.toLocaleString('en-IN')}. Don't miss out!`,
          type: 'new_auction',
        }));

        await prisma.notification.createMany({ data: notificationData });

        // Push real-time notifications via socket
        const io = getIO();
        if (io) {
          subscribers.forEach(sub => {
            io.to(`user:${sub.userId}`).emit('new_notification', {
              title: `New auction in "${product.category}"`,
              message: `"${product.name}" is now up for bidding at ₹${product.basePrice.toLocaleString('en-IN')}. Don't miss out!`,
              type: 'new_auction',
              auctionId: auction.id,
              createdAt: new Date().toISOString(),
            });
          });
        }

        console.log(`📢 Notified ${subscribers.length} subscriber(s) for category "${product.category}"`);
      }
    } catch (notifError) {
      // Don't fail the auction creation if notifications fail
      console.error('Category notification error:', notifError);
    }

    res.status(201).json({ message: 'Auction created successfully.', auction });
  } catch (error) {
    console.error('Create auction error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// GET /api/auctions
const getAuctions = async (req, res) => {
  try {
    const { status = 'ACTIVE', page = 1, limit = 12, sort = 'latest', type } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = { status };
    if (type) where.type = type;

    let orderBy = { createdAt: 'desc' };
    if (sort === 'ending_soon') orderBy = { endTime: 'asc' };
    if (sort === 'price_asc') orderBy = { bestPrice: 'asc' };
    if (sort === 'price_desc') orderBy = { bestPrice: 'desc' };

    const [auctions, total] = await Promise.all([
      prisma.auctionRoom.findMany({
        where,
        orderBy,
        skip,
        take: parseInt(limit),
        include: {
          product: true,
          seller: { select: { id: true, name: true, rating: true } },
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
    console.error('Get auctions error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// GET /api/auctions/:id
const getAuctionById = async (req, res) => {
  try {
    const auction = await prisma.auctionRoom.findUnique({
      where: { id: req.params.id },
      include: {
        product: true,
        seller: { select: { id: true, name: true, email: true, rating: true, phoneNumber: true } },
        highestBuyer: { select: { id: true, name: true } },
        bids: {
          orderBy: { createdAt: 'desc' },
          include: { user: { select: { id: true, name: true } } },
        },
      },
    });

    if (!auction) {
      return res.status(404).json({ message: 'Auction not found.' });
    }

    // Hide seller contact info unless auction is completed and user is the winner
    if (auction.status !== 'COMPLETED') {
      auction.seller.email = undefined;
      auction.seller.phoneNumber = undefined;
    }

    res.json({ auction });
  } catch (error) {
    console.error('Get auction error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// POST /api/auctions/:id/end (for OPEN auctions - seller manually ends)
const endAuction = async (req, res) => {
  try {
    const auction = await prisma.auctionRoom.findUnique({
      where: { id: req.params.id },
      include: {
        product: true,
        seller: {
          select: { id: true, name: true, email: true, phoneNumber: true },
        },
        highestBuyer: {
          select: { id: true, name: true, email: true, phoneNumber: true },
        },
      },
    });

    if (!auction) {
      return res.status(404).json({ message: 'Auction not found.' });
    }
    if (auction.sellerId !== req.user.id) {
      return res.status(403).json({ message: 'Only the seller can end this auction.' });
    }
    if (auction.status !== 'ACTIVE') {
      return res.status(400).json({ message: 'Auction is not active.' });
    }

    const updatedAuction = await prisma.auctionRoom.update({
      where: { id: auction.id },
      data: { status: 'COMPLETED' },
      include: { product: true, highestBuyer: true },
    });

    const productDetails = {
      productName: auction.product.name,
      productDescription: auction.product.description,
      productCategory: auction.product.category,
      finalPrice: auction.bestPrice,
    };

    if (auction.highestBuyer) {
      // Email to buyer with seller contact
      await sendAuctionWonEmailToBuyer(auction.highestBuyer.email, {
        ...productDetails,
        sellerName: auction.seller.name,
        sellerEmail: auction.seller.email,
        sellerPhone: auction.seller.phoneNumber,
      });

      // Email to seller with buyer contact
      await sendAuctionSoldEmailToSeller(auction.seller.email, {
        ...productDetails,
        buyerName: auction.highestBuyer.name,
        buyerEmail: auction.highestBuyer.email,
        buyerPhone: auction.highestBuyer.phoneNumber,
      });

      // In-app notifications
      await prisma.notification.create({
        data: {
          userId: auction.highestBuyerId,
          title: 'You won an auction!',
          message: `Congratulations! You won "${auction.product.name}" at ₹${auction.bestPrice}. Check your email for seller contact details.`,
          type: 'auction_won',
        },
      });

      await prisma.notification.create({
        data: {
          userId: auction.sellerId,
          title: 'Your item has been sold!',
          message: `Your auction for "${auction.product.name}" sold for ₹${auction.bestPrice} to ${auction.highestBuyer.name}. Check your email for buyer contact details.`,
          type: 'auction_ended',
        },
      });
    } else {
      // No bids
      await sendAuctionNoBidsEmail(auction.seller.email, productDetails);

      await prisma.notification.create({
        data: {
          userId: auction.sellerId,
          title: 'Your auction ended with no bids',
          message: `Your auction for "${auction.product.name}" ended without any bids.`,
          type: 'auction_ended',
        },
      });
    }

    res.json({ message: 'Auction ended successfully.', auction: updatedAuction });
  } catch (error) {
    console.error('End auction error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// GET /api/auctions/:id/bids
const getAuctionBids = async (req, res) => {
  try {
    const bids = await prisma.bid.findMany({
      where: { auctionRoomId: req.params.id },
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { id: true, name: true } } },
    });

    res.json({ bids });
  } catch (error) {
    console.error('Get bids error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// POST /api/auctions/:id/bid/withdraw
const withdrawBid = async (req, res) => {
  try {
    const auction = await prisma.auctionRoom.findUnique({
      where: { id: req.params.id },
      include: {
        bids: { orderBy: { amount: 'desc' }, include: { user: true } },
        product: true,
      },
    });

    if (!auction) {
      return res.status(404).json({ message: 'Auction not found.' });
    }
    if (auction.status !== 'ACTIVE') {
      return res.status(400).json({ message: 'Auction is not active.' });
    }
    if (auction.highestBuyerId !== req.user.id) {
      return res.status(403).json({ message: 'Only the highest bidder can withdraw.' });
    }

    // Mark the bid as withdrawn
    const highestBid = auction.bids.find(
      (b) => b.userId === req.user.id && b.status === 'VALID'
    );
    if (highestBid) {
      await prisma.bid.update({
        where: { id: highestBid.id },
        data: { status: 'WITHDRAWN' },
      });
    }

    // Flag the user who backed out (three-strike system)
    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: { numberOfFlags: { increment: 1 } },
    });

    // Auto-block if 3 strikes reached
    if (updatedUser.numberOfFlags >= 3) {
      await prisma.user.update({
        where: { id: req.user.id },
        data: { isBlocked: true },
      });
    }

    // Find the next highest valid bid
    const nextBid = auction.bids.find(
      (b) => b.userId !== req.user.id && b.status === 'VALID'
    );

    if (nextBid) {
      await prisma.auctionRoom.update({
        where: { id: auction.id },
        data: {
          highestBuyerId: nextBid.userId,
          bestPrice: nextBid.amount,
        },
      });

      // Notify the previous bidder they are now highest
      await prisma.notification.create({
        data: {
          userId: nextBid.userId,
          title: 'You are now the highest bidder!',
          message: `The previous highest bidder withdrew from "${auction.product.name}". You are now the top bidder at ₹${nextBid.amount}.`,
          type: 'bid_update',
        },
      });
    } else {
      // No other bids, reset auction
      await prisma.auctionRoom.update({
        where: { id: auction.id },
        data: {
          highestBuyerId: null,
          bestPrice: auction.product?.basePrice || 0,
        },
      });
    }

    // Create flag record
    await prisma.flag.create({
      data: {
        reason: 'Withdrew from highest bid',
        authorId: auction.sellerId,
        targetId: req.user.id,
      },
    });

    res.json({
      message: 'Bid withdrawn. You have been flagged for backing out.',
      flags: updatedUser.numberOfFlags,
    });
  } catch (error) {
    console.error('Withdraw bid error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// GET /api/auctions/my - Get current user's auctions (as seller)
const getMyAuctions = async (req, res) => {
  try {
    const auctions = await prisma.auctionRoom.findMany({
      where: { sellerId: req.user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        product: true,
        highestBuyer: { select: { id: true, name: true } },
        _count: { select: { bids: true } },
      },
    });
    res.json({ auctions });
  } catch (error) {
    console.error('Get my auctions error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// GET /api/auctions/my-bids - Get auctions user has bid on
const getMyBids = async (req, res) => {
  try {
    const bids = await prisma.bid.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        auctionRoom: {
          include: {
            product: true,
            highestBuyer: { select: { id: true, name: true } },
          },
        },
      },
    });
    res.json({ bids });
  } catch (error) {
    console.error('Get my bids error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

module.exports = {
  createAuction,
  getAuctions,
  getAuctionById,
  endAuction,
  getAuctionBids,
  withdrawBid,
  getMyAuctions,
  getMyBids,
};
