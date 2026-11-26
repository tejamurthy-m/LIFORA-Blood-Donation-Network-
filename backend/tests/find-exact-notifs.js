import { prisma } from '../src/config/prisma.js';

async function main() {
  const notifs = await prisma.notification.findMany({
    where: { message: { contains: 'tejamurthy has requested' } },
    include: { user: { select: { email: true, fullName: true, role: true } } },
  });
  console.log(`Found ${notifs.length} matching notifications:`);
  console.log(JSON.stringify(notifs, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
