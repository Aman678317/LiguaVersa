import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // 1. Seed Roles
  const adminRole = await prisma.role.upsert({
    where: { name: 'ADMIN' },
    update: {},
    create: { name: 'ADMIN', description: 'System Administrator' },
  });

  const userRole = await prisma.role.upsert({
    where: { name: 'USER' },
    update: {},
    create: { name: 'USER', description: 'Standard User' },
  });

  // 2. Seed Languages
  const enLang = await prisma.language.upsert({
    where: { code: 'en' },
    update: {},
    create: { code: 'en', name: 'English' },
  });

  const jaLang = await prisma.language.upsert({
    where: { code: 'ja' },
    update: {},
    create: { code: 'ja', name: 'Japanese' },
  });

  // 3. Seed Organization & Team
  const users = [
    { email: 'demo@linguaverse.com', firstName: 'Priya', lastName: 'Demo', timezone: 'UTC' },
    { email: 'sundar@linguaverse.com', firstName: 'Sundar', lastName: 'Pichai', timezone: 'PST' },
    { email: 'sam@linguaverse.com', firstName: 'Sam', lastName: 'Altman', timezone: 'PST' },
    { email: 'satya@linguaverse.com', firstName: 'Satya', lastName: 'Nadella', timezone: 'PST' },
  ];

  for (const u of users) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: {
        email: u.email,
        profile: {
          create: {
            firstName: u.firstName,
            lastName: u.lastName,
            timezone: u.timezone,
          }
        }
      }
    });
  }

  const org = await prisma.organization.upsert({
    where: { domain: 'linguaverse.ai' },
    update: {},
    create: {
      name: 'LinguaVerse Inc.',
      domain: 'linguaverse.ai',
    },
  });

  const team = await prisma.team.create({
    data: {
      name: 'Engineering',
      organizationId: org.id,
    },
  });

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
