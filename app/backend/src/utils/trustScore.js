const prisma = require('./prisma');

// ────────────────────────────────────────────────
// Trust Score Algorithm
// ────────────────────────────────────────────────
// Trust Score = weighted average of:
//   1. Direct Rating Avg  (80%)  – average of all overallScore received
//   2. Activity Score     (20%)  – based on completed auctions (bought + sold)
//
// If ratingCount == 0  →  trustScore stays 0, frontend shows "New User"
// ────────────────────────────────────────────────

async function recalculateTrustScore(userId) {
  // 1. Direct rating average
  const ratings = await prisma.rating.findMany({
    where: { targetId: userId },
    select: { overallScore: true },
  });

  const ratingCount = ratings.length;

  if (ratingCount === 0) {
    await prisma.user.update({
      where: { id: userId },
      data: { rating: 0, ratingCount: 0 },
    });
    return { trustScore: 0, ratingCount: 0 };
  }

  const directAvg =
    ratings.reduce((sum, r) => sum + r.overallScore, 0) / ratingCount;

  // 2. Activity score (completed auctions as seller + won auctions as buyer)
  const [soldCount, boughtCount] = await Promise.all([
    prisma.auctionRoom.count({
      where: { sellerId: userId, status: 'COMPLETED' },
    }),
    prisma.auctionRoom.count({
      where: { highestBuyerId: userId, status: 'COMPLETED' },
    }),
  ]);
  const totalActivity = soldCount + boughtCount;
  // Normalize: 10+ completed auctions = max score (1.0)
  const activityScore = Math.min(totalActivity / 10, 1.0);

  // Weighted combination: 80% direct rating + 20% activity
  const rawScore = directAvg * 0.8 + activityScore * 5 * 0.2;

  // Clamp to 0-5 and round to 1 decimal
  const trustScore = Math.round(Math.min(Math.max(rawScore, 0), 5) * 10) / 10;

  await prisma.user.update({
    where: { id: userId },
    data: { rating: trustScore, ratingCount },
  });

  return { trustScore, ratingCount };
}

module.exports = { recalculateTrustScore };
