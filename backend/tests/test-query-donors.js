import { donorService } from '../src/services/donor.service.js';
import { prisma } from '../src/config/prisma.js';

async function main() {
  const result1 = await donorService.getDonors({
    city: 'Bangalore',
    bloodGroup: 'O+',
    userLat: 12.9716,
    userLng: 77.5946,
    maxDistance: 25,
  });
  console.log(`With bloodGroup=O+: ${result1.length} donors found.`);

  const resultAll = await donorService.getDonors({
    city: 'Bangalore',
  });
  console.log(`With just city=Bangalore: ${resultAll.length} donors found.`);
  for (const d of resultAll) {
    console.log(`- ${d.name}: bloodGroup=${d.bloodGroup}, verified=${d.verified}, dist=${d.distanceKm}`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
