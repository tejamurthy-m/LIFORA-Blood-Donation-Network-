import { PrismaClient, UserRole, BloodGroup, VerificationStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const bangaloreDonors = [
  {
    name: 'Vikram Reddy',
    email: 'vikram.reddy@example.com',
    phone: '+91 98451 00001',
    bloodGroup: BloodGroup.AB_POSITIVE,
    city: 'Bangalore',
    area: 'Indiranagar',
    lat: 12.9784,
    lng: 77.6408,
    badge: 'Golden Donor',
    totalDonations: 8,
    lastDonationDate: new Date('2026-08-28'),
    age: 30,
    emergencyReady: true,
    bio: 'Software engineer and voluntary blood donor. Available on weekends and emergency calls.',
  },
  {
    name: 'Ananya Sen',
    email: 'ananya.sen@example.com',
    phone: '+91 98451 00002',
    bloodGroup: BloodGroup.O_POSITIVE,
    city: 'Bangalore',
    area: 'Koramangala',
    lat: 12.9352,
    lng: 77.6245,
    badge: 'Verified Donor',
    totalDonations: 6,
    lastDonationDate: new Date('2026-09-12'),
    age: 28,
    emergencyReady: true,
    bio: 'Active donor for oncology and trauma center emergency requisitions.',
  },
  {
    name: 'Rahul Nair',
    email: 'rahul.nair@example.com',
    phone: '+91 98451 00003',
    bloodGroup: BloodGroup.A_POSITIVE,
    city: 'Bangalore',
    area: 'Whitefield',
    lat: 12.9698,
    lng: 77.7500,
    badge: 'Silver Donor',
    totalDonations: 4,
    lastDonationDate: new Date('2026-07-04'),
    age: 33,
    emergencyReady: false,
    bio: 'Corporate donor at Whitefield tech park.',
  },
  {
    name: 'Priya Sharma',
    email: 'priya.sharma.blr@example.com',
    phone: '+91 98451 00004',
    bloodGroup: BloodGroup.B_POSITIVE,
    city: 'Bangalore',
    area: 'HSR Layout',
    lat: 12.9121,
    lng: 77.6446,
    badge: 'Verified Donor',
    totalDonations: 5,
    lastDonationDate: new Date('2026-08-15'),
    age: 26,
    emergencyReady: true,
    bio: 'Designer and voluntary platelets and blood donor.',
  },
  {
    name: 'Karthik Varma',
    email: 'karthik.varma@example.com',
    phone: '+91 98451 00005',
    bloodGroup: BloodGroup.O_NEGATIVE,
    city: 'Bangalore',
    area: 'Basavanagudi',
    lat: 12.9422,
    lng: 77.5753,
    badge: 'Universal Lifesaver',
    totalDonations: 12,
    lastDonationDate: new Date('2026-06-20'),
    age: 36,
    emergencyReady: true,
    bio: 'Universal O- negative donor. Responds rapidly to emergency requests in South Bangalore.',
  },
];

async function seedBangaloreDonors() {
  const passwordHash = await bcrypt.hash('donor123', 10);

  for (const d of bangaloreDonors) {
    const existing = await prisma.user.findUnique({
      where: { email: d.email },
    });

    if (existing) {
      console.log(`User ${d.name} (${d.email}) already exists. Skipping.`);
      continue;
    }

    const user = await prisma.user.create({
      data: {
        email: d.email,
        passwordHash,
        fullName: d.name,
        phone: d.phone,
        role: UserRole.DONOR,
        city: d.city,
        area: d.area,
      },
    });

    await prisma.donorProfile.create({
      data: {
        userId: user.id,
        bloodGroup: d.bloodGroup,
        latitude: d.lat,
        longitude: d.lng,
        isAvailable: true,
        emergencyReady: d.emergencyReady,
        badge: d.badge,
        totalDonations: d.totalDonations,
        lastDonationDate: d.lastDonationDate,
        profileCompletion: 90,
        bio: d.bio,
        age: d.age,
        verificationStatus: VerificationStatus.VERIFIED,
      },
    });

    console.log(`Created Bangalore donor: ${d.name} (${d.bloodGroup}) in ${d.area}, ${d.city}`);
  }

  const allDonors = await prisma.donorProfile.findMany({
    include: { user: true },
  });
  console.log(`Total donors in Supabase now: ${allDonors.length}`);
}

seedBangaloreDonors()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
