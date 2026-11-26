import bcrypt from 'bcryptjs';
import { prisma } from '../src/config/prisma.js';

async function main() {
  const teja = await prisma.user.findFirst({ where: { email: 'tejamurthycng@gmail.com' } });
  if (teja) {
    const hash = await bcrypt.hash('donor123', 10);
    await prisma.user.update({
      where: { id: teja.id },
      data: { passwordHash: hash },
    });
    console.log('Updated tejamurthy password to donor123');
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
