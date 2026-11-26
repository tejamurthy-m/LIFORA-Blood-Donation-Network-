import { prisma } from '../src/config/prisma.js';

async function main() {
  const donors = await prisma.donorProfile.findMany({
    include: { user: { select: { fullName: true, city: true, area: true, email: true } } },
  });
  console.log(`Total donors in DB: ${donors.length}`);
  for (const d of donors) {
    console.log(`- ${d.user.fullName} (${d.user.email}): ${d.bloodGroup}, City: ${d.user.city}, Status: ${d.verificationStatus}, Available: ${d.isAvailable}`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
