  const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...\n');

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@auction.com' },
    update: {},
    create: {
      name: 'Admin',
      email: 'admin@auction.com',
      password: adminPassword,
      pan: 'ADMIN00001',
      phoneNumber: '9999999999',
      role: 'ADMIN',
      isVerified: true,
    },
  });
  console.log('✅ Admin user created:', admin.email);

  // Create demo users
  const userPassword = await bcrypt.hash('user123', 12);

  const seller = await prisma.user.upsert({
    where: { email: 'seller@demo.com' },
    update: {},
    create: {
      name: 'Rahul Sharma',
      email: 'seller@demo.com',
      password: userPassword,
      pan: 'ABCDE1234F',
      phoneNumber: '9876543210',
      role: 'USER',
      isVerified: true,
      rating: 4.5,
      ratingCount: 10,
      favoriteCategories: ['Electronics', 'Art'],
    },
  });
  console.log('✅ Seller user created:', seller.email);

  const buyer = await prisma.user.upsert({
    where: { email: 'buyer@demo.com' },
    update: {},
    create: {
      name: 'Priya Patel',
      email: 'buyer@demo.com',
      password: userPassword,
      pan: 'FGHIJ5678K',
      phoneNumber: '9876543211',
      role: 'USER',
      isVerified: true,
      rating: 4.2,
      ratingCount: 5,
      favoriteCategories: ['Collectibles', 'Electronics'],
    },
  });
  console.log('✅ Buyer user created:', buyer.email);

  const buyer2 = await prisma.user.upsert({
    where: { email: 'buyer2@demo.com' },
    update: {},
    create: {
      name: 'Amit Kumar',
      email: 'buyer2@demo.com',
      password: userPassword,
      pan: 'LMNOP9012Q',
      phoneNumber: '9876543212',
      role: 'USER',
      isVerified: true,
      favoriteCategories: ['Art', 'Vehicles'],
    },
  });
  console.log('✅ Buyer2 user created:', buyer2.email);

  // Create products
  const products = await Promise.all([
    prisma.product.upsert({
      where: { id: 'prod-1' },
      update: {},
      create: {
        id: 'prod-1',
        name: 'Vintage Rolex Submariner 1968',
        description: 'Rare vintage Rolex Submariner from 1968 in excellent condition. Original dial, hands, and bezel. Comes with original box and papers.',
        category: 'Collectibles',
        basePrice: 150000,
        sellerId: seller.id,
      },
    }),
    prisma.product.upsert({
      where: { id: 'prod-2' },
      update: {},
      create: {
        id: 'prod-2',
        name: 'MacBook Pro M3 Max - 16"',
        description: 'Brand new MacBook Pro with M3 Max chip, 36GB RAM, 1TB SSD. Sealed in box with Apple warranty.',
        category: 'Electronics',
        basePrice: 250000,
        sellerId: seller.id,
      },
    }),
    prisma.product.upsert({
      where: { id: 'prod-3' },
      update: {},
      create: {
        id: 'prod-3',
        name: 'Original Oil Painting - "Sunset Valley"',
        description: 'Original oil painting by contemporary artist Meera Singh. Canvas size 24x36 inches. Certificate of authenticity included.',
        category: 'Art',
        basePrice: 45000,
        sellerId: seller.id,
      },
    }),
    prisma.product.upsert({
      where: { id: 'prod-4' },
      update: {},
      create: {
        id: 'prod-4',
        name: 'Royal Enfield Classic 350 - 2022',
        description: 'Well maintained Royal Enfield Classic 350 (2022 model). Only 5000 km driven. All service records available.',
        category: 'Vehicles',
        basePrice: 120000,
        sellerId: seller.id,
      },
    }),
    prisma.product.upsert({
      where: { id: 'prod-5' },
      update: {},
      create: {
        id: 'prod-5',
        name: 'Antique Teak Wood Dining Set',
        description: '100-year-old teak wood dining table with 6 chairs. Hand-carved details. Perfect for collectors.',
        category: 'Furniture',
        basePrice: 80000,
        sellerId: seller.id,
      },
    }),
    prisma.product.upsert({
      where: { id: 'prod-6' },
      update: {},
      create: {
        id: 'prod-6',
        name: 'Sony PlayStation 5 Pro Bundle',
        description: 'PS5 Pro with 2 controllers, 5 games, and PS Plus 1-year subscription. Like new condition.',
        category: 'Electronics',
        basePrice: 55000,
        sellerId: seller.id,
      },
    }),
  ]);
  console.log(`✅ ${products.length} products created`);

  // Create auctions
  const now = new Date();
  const auctions = await Promise.all([
    prisma.auctionRoom.upsert({
      where: { productId: 'prod-1' },
      update: {},
      create: {
        productId: 'prod-1',
        sellerId: seller.id,
        type: 'TIME_BOUND',
        endTime: new Date(now.getTime() + 24 * 60 * 60 * 1000), // 24 hours
        bestPrice: 150000,
      },
    }),
    prisma.auctionRoom.upsert({
      where: { productId: 'prod-2' },
      update: {},
      create: {
        productId: 'prod-2',
        sellerId: seller.id,
        type: 'OPEN',
        bestPrice: 250000,
      },
    }),
    prisma.auctionRoom.upsert({
      where: { productId: 'prod-3' },
      update: {},
      create: {
        productId: 'prod-3',
        sellerId: seller.id,
        type: 'TIME_BOUND',
        endTime: new Date(now.getTime() + 48 * 60 * 60 * 1000), // 48 hours
        bestPrice: 45000,
      },
    }),
    prisma.auctionRoom.upsert({
      where: { productId: 'prod-4' },
      update: {},
      create: {
        productId: 'prod-4',
        sellerId: seller.id,
        type: 'OPEN',
        bestPrice: 120000,
      },
    }),
    prisma.auctionRoom.upsert({
      where: { productId: 'prod-6' },
      update: {},
      create: {
        productId: 'prod-6',
        sellerId: seller.id,
        type: 'TIME_BOUND',
        endTime: new Date(now.getTime() + 12 * 60 * 60 * 1000), // 12 hours
        bestPrice: 55000,
      },
    }),
  ]);
  console.log(`✅ ${auctions.length} auctions created`);

  // Create some bids
  const auctionForBids = auctions[0];
  await prisma.bid.createMany({
    data: [
      { amount: 155000, userId: buyer.id, auctionRoomId: auctionForBids.id },
      { amount: 162000, userId: buyer2.id, auctionRoomId: auctionForBids.id },
      { amount: 170000, userId: buyer.id, auctionRoomId: auctionForBids.id },
    ],
    skipDuplicates: true,
  });

  // Update auction with highest bid
  await prisma.auctionRoom.update({
    where: { id: auctionForBids.id },
    data: { bestPrice: 170000, highestBuyerId: buyer.id },
  });
  console.log('✅ Sample bids created');

  // Create a comment
  await prisma.comment.create({
    data: {
      content: 'Great seller! Product was exactly as described.',
      authorId: buyer.id,
      targetId: seller.id,
    },
  });
  console.log('✅ Sample comment created');

  console.log('\n🎉 Database seeded successfully!');
  console.log('\n📋 Login credentials:');
  console.log('   Admin:  admin@auction.com / admin123');
  console.log('   Seller: seller@demo.com / user123');
  console.log('   Buyer:  buyer@demo.com / user123');
  console.log('   Buyer2: buyer2@demo.com / user123\n');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
