import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('password123', 10);

  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      passwordHash,
      role: 'ADMIN',
    },
  });

  const testUser = await prisma.user.upsert({
    where: { username: 'testuser' },
    update: {},
    create: {
      username: 'testuser',
      passwordHash,
      role: 'USER',
    },
  });

  // Invitation codes
  await prisma.invitationCode.createMany({
    skipDuplicates: true,
    data: [
      { code: 'WELCOME2025', maxUses: 50, createdBy: admin.id },
      { code: 'BETA-TESTER', maxUses: 20, createdBy: admin.id },
      { code: 'FRIEND-INVITE', maxUses: 10, createdBy: testUser.id },
    ],
  });

  // Sample spots around Tarifa, Spain
  const spots = [
    { name: 'Playa de Los Lances', latitude: 36.0089, longitude: -5.6053 },
    { name: 'Valdevaqueros', latitude: 36.0611, longitude: -5.6847 },
    { name: 'Balneario', latitude: 36.0125, longitude: -5.6017 },
    { name: 'Punta Paloma', latitude: 36.0567, longitude: -5.6750 },
    { name: 'Hurricane Hotel', latitude: 36.0250, longitude: -5.6200 },
    { name: 'Arte Vida', latitude: 36.0350, longitude: -5.6350 },
    { name: 'Bolonia', latitude: 36.0886, longitude: -5.7722 },
    { name: 'Caños de Meca', latitude: 36.1833, longitude: -5.9333 },
  ];

  for (const spot of spots) {
    await prisma.spot.upsert({
      where: { id: spot.name }, // will not match, forces create
      update: {},
      create: {
        name: spot.name,
        latitude: spot.latitude,
        longitude: spot.longitude,
        createdBy: admin.id,
      },
    });
  }

  console.log('Seed complete:', { admin: admin.id, testUser: testUser.id });
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
