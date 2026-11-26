import { prisma } from '../src/config/prisma.js';

async function main() {
  const teja = await prisma.user.findFirst({ where: { email: 'tejamurthycng@gmail.com' } });
  if (!teja) {
    console.log('Teja not found');
    return;
  }
  const notifs = await prisma.notification.findMany({
    where: { userId: teja.id },
    orderBy: { createdAt: 'desc' },
  });
  console.log(`Found ${notifs.length} notifications for tejamurthy:`);
  console.log(JSON.stringify(notifs, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
