const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const users = await prisma.user.findMany({ select: { name: true, email: true, pan: true, phoneNumber: true, role: true }});
  console.log(users);
}
main().finally(() => prisma.$disconnect());
