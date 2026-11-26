import { prisma } from '../src/config/prisma.js';

async function main() {
  const users = await prisma.user.findMany({
    select: { id: true, email: true, fullName: true, role: true, city: true },
  });
  console.log('--- USERS ---');
  console.log(JSON.stringify(users, null, 2));

  const notifs = await prisma.notification.findMany({
    orderBy: { createdAt: 'desc' },
    take: 10,
    include: { user: { select: { email: true, fullName: true, role: true } } },
  });
  console.log('--- NOTIFICATIONS ---');
  console.log(JSON.stringify(notifs, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
