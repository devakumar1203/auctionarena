const jwt = require('jsonwebtoken');
const prisma = require('../utils/prisma');
const { sendOutbidEmail } = require('../services/emailService');

const setupSocketHandlers = (io) => {
  // Socket authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication required'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: { id: true, name: true, email: true, role: true, isBlocked: true },
      });

      if (!user || user.isBlocked) {
        return next(new Error('Access denied'));
      }

      socket.user = user;
      next();
    } catch (error) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.user.name} (${socket.user.id})`);

    // Join an auction room
    socket.on('join_auction', async (auctionId) => {
      try {
        const auction = await prisma.auctionRoom.findUnique({
          where: { id: auctionId },
          include: {
            product: true,
            bids: {
              orderBy: { createdAt: 'desc' },
              take: 50,
              include: { user: { select: { id: true, name: true } } },
            },
          },
        });

        if (!auction) {
          socket.emit('bid_error', { message: 'Auction not found.' });
          return;
        }

        socket.join(auctionId);
        console.log(`${socket.user.name} joined auction: ${auctionId}`);

        // Send current auction state to the joining user
        socket.emit('auction_state', {
          auctionId: auction.id,
          bestPrice: auction.bestPrice,
          highestBuyerId: auction.highestBuyerId,
          status: auction.status,
          bids: auction.bids,
          product: auction.product,
        });
      } catch (error) {
        console.error('Join auction error:', error);
        socket.emit('bid_error', { message: 'Failed to join auction.' });
      }
    });

    // Leave an auction room
    socket.on('leave_auction', (auctionId) => {
      socket.leave(auctionId);
      console.log(`${socket.user.name} left auction: ${auctionId}`);
    });

    // Place a bid
    socket.on('place_bid', async ({ auctionId, amount }) => {
      try {
        const bidAmount = parseFloat(amount);

        // Get auction with lock-like behavior
        const auction = await prisma.auctionRoom.findUnique({
          where: { id: auctionId },
          include: { product: true },
        });

        if (!auction) {
          socket.emit('bid_error', { message: 'Auction not found.' });
          return;
        }

        if (auction.status !== 'ACTIVE') {
          socket.emit('bid_error', { message: 'This auction has ended.' });
          return;
        }

        // Check if time-bound auction has expired
        if (auction.type === 'TIME_BOUND' && auction.endTime && new Date() > new Date(auction.endTime)) {
          socket.emit('bid_error', { message: 'This auction has expired.' });
          return;
        }

        if (auction.sellerId === socket.user.id) {
          socket.emit('bid_error', { message: 'You cannot bid on your own auction.' });
          return;
        }

        if (bidAmount <= auction.bestPrice) {
          socket.emit('bid_error', {
            message: `Bid must be greater than the current best price of ₹${auction.bestPrice}.`,
          });
          return;
        }

        // Get the previous highest bidder before updating
        const previousHighestBuyerId = auction.highestBuyerId;

        // Create bid and update auction atomically using transaction
        const [bid, updatedAuction] = await prisma.$transaction([
          prisma.bid.create({
            data: {
              amount: bidAmount,
              userId: socket.user.id,
              auctionRoomId: auctionId,
            },
          }),
          prisma.auctionRoom.update({
            where: { id: auctionId },
            data: {
              bestPrice: bidAmount,
              highestBuyerId: socket.user.id,
            },
          }),
        ]);

        // Build bid info for broadcast
        const bidInfo = {
          id: bid.id,
          amount: bid.amount,
          user: { id: socket.user.id, name: socket.user.name },
          createdAt: bid.createdAt,
        };

        // Broadcast to all users in the room
        io.to(auctionId).emit('bid_update', {
          auctionId,
          newHighestBid: bidAmount,
          highestBuyerId: socket.user.id,
          highestBuyerName: socket.user.name,
          bid: bidInfo,
        });

        // Notify the previous highest bidder they've been outbid
        if (previousHighestBuyerId && previousHighestBuyerId !== socket.user.id) {
          const previousBuyer = await prisma.user.findUnique({
            where: { id: previousHighestBuyerId },
            select: { email: true },
          });

          if (previousBuyer) {
            await sendOutbidEmail(previousBuyer.email, {
              productName: auction.product.name,
              amount: bidAmount,
            });
          }

          // Create notification
          await prisma.notification.create({
            data: {
              userId: previousHighestBuyerId,
              title: 'You have been outbid!',
              message: `Someone placed a higher bid of ₹${bidAmount} on "${auction.product.name}".`,
              type: 'outbid',
            },
          });
        }

        console.log(`Bid placed: ₹${bidAmount} by ${socket.user.name} on auction ${auctionId}`);
      } catch (error) {
        console.error('Place bid error:', error);
        socket.emit('bid_error', { message: 'Failed to place bid. Please try again.' });
      }
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.user.name}`);
    });
  });
};

module.exports = setupSocketHandlers;
