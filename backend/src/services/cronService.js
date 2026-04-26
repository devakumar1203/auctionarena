const cron = require('node-cron');
const prisma = require('../utils/prisma');
const {
  sendAuctionWonEmailToBuyer,
  sendAuctionSoldEmailToSeller,
  sendAuctionNoBidsEmail,
} = require('../services/emailService');

const setupCronJobs = (io) => {
  // Check for expired time-bound auctions every 30 seconds
  cron.schedule('*/30 * * * * *', async () => {
    try {
      const expiredAuctions = await prisma.auctionRoom.findMany({
        where: {
          type: 'TIME_BOUND',
          status: 'ACTIVE',
          endTime: { lte: new Date() },
        },
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

      for (const auction of expiredAuctions) {
        // Mark auction as completed
        await prisma.auctionRoom.update({
          where: { id: auction.id },
          data: { status: 'COMPLETED' },
        });

        // Notify via socket
        if (io) {
          io.to(auction.id).emit('auction_ended', {
            auctionId: auction.id,
            productName: auction.product.name,
            winnerId: auction.highestBuyerId,
            winnerName: auction.highestBuyer?.name || null,
            finalPrice: auction.bestPrice,
          });
        }

        const productDetails = {
          productName: auction.product.name,
          productDescription: auction.product.description,
          productCategory: auction.product.category,
          finalPrice: auction.bestPrice,
        };

        if (auction.highestBuyer) {
          // ── Email to BUYER with seller contact ──
          await sendAuctionWonEmailToBuyer(auction.highestBuyer.email, {
            ...productDetails,
            sellerName: auction.seller.name,
            sellerEmail: auction.seller.email,
            sellerPhone: auction.seller.phoneNumber,
          });

          // ── Email to SELLER with buyer contact ──
          await sendAuctionSoldEmailToSeller(auction.seller.email, {
            ...productDetails,
            buyerName: auction.highestBuyer.name,
            buyerEmail: auction.highestBuyer.email,
            buyerPhone: auction.highestBuyer.phoneNumber,
          });

          // In-app notification to buyer
          await prisma.notification.create({
            data: {
              userId: auction.highestBuyerId,
              title: 'You won an auction!',
              message: `Congratulations! You won "${auction.product.name}" at ₹${auction.bestPrice}. Check your email for seller contact details.`,
              type: 'auction_won',
            },
          });

          // In-app notification to seller
          await prisma.notification.create({
            data: {
              userId: auction.sellerId,
              title: 'Your item has been sold!',
              message: `Your auction for "${auction.product.name}" sold for ₹${auction.bestPrice} to ${auction.highestBuyer.name}. Check your email for buyer contact details.`,
              type: 'auction_ended',
            },
          });
        } else {
          // No bids — notify seller
          await sendAuctionNoBidsEmail(auction.seller.email, productDetails);

          await prisma.notification.create({
            data: {
              userId: auction.sellerId,
              title: 'Your auction ended with no bids',
              message: `Your auction for "${auction.product.name}" ended without receiving any bids. Consider re-listing with a lower price.`,
              type: 'auction_ended',
            },
          });
        }

        console.log(`Auction ${auction.id} (${auction.product.name}) auto-completed.`);
      }
    } catch (error) {
      console.error('Cron job error:', error);
    }
  });

  console.log('⏰ Cron jobs initialized - checking for expired auctions every 30s');
};

module.exports = setupCronJobs;
