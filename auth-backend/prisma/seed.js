// prisma/seed.js
const { PrismaClient, Role, Type, AuthMode } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  const passwordPlain = 'Password123!';
  const passwordHash = await bcrypt.hash(passwordPlain, 10);

  //
  // 1) Create or update User
  //
  const user = await prisma.user.upsert({
    where: { email: 'alice@example.com' }, // unique
    update: {
      password: passwordHash,
      isActive: true,
      name: 'Alice Test User',
      type: Type.EXTERNAL,
      // For scalar list fields (Role[]), use set: [...] in update
      role: {
        set: [Role.USER],
      },
      department: 'CSE',
      mobile: '9876543210',
      isOnboarded: true,
    },
    create: {
      email: 'alice@example.com',
      name: 'Alice Test User',
      password: passwordHash,
      isActive: true,
      type: Type.EXTERNAL,
      role: [Role.USER],
      department: 'CSE',
      mobile: '9876543210',
      isOnboarded: true,
    },
  });

  console.log('✅ User upserted:', user.email);

  //
  // 2) Create or update client
  //
  const client = await prisma.client.upsert({
    where: { clientId: 'portal-frontend' }, // unique
    update: {
      name: 'Main Portal',
      clientSecret: 'dev-secret-123',
      // For String[] scalar lists, use set: [...]
      redirectUris: {
        set: [
          'http://localhost:3000/auth/callback',
          'http://localhost:5173/auth/callback',
        ],
      },
      authMode: AuthMode.BOTH,
    },
    create: {
      name: 'Main Portal',
      clientId: 'portal-frontend',
      clientSecret: 'dev-secret-123',
      redirectUris: [
        'http://localhost:3000/auth/callback',
        'http://localhost:5173/auth/callback',
      ],
      authMode: AuthMode.BOTH,
    },
  });

  console.log('✅ Client upserted:', client.clientId);

  //
  // 3) Link user ↔ client via ClientRole (safe: check first)
  //
  const existingRole = await prisma.clientRole.findFirst({
    where: {
      userId: user.id,
      clientId: client.id,
      role: 'USER', // this is a String in schema, not enum
    },
  });

  if (existingRole) {
    console.log('ℹ ClientRole already exists:', existingRole.id);
  } else {
    const created = await prisma.clientRole.create({
      data: {
        userId: user.id,
        clientId: client.id,
        role: 'USER', // e.g. STUDENT / MENTOR / ADMIN etc. (String field)
      },
    });

    console.log('✅ ClientRole created:', created.id);
  }

  console.log('🎉 Seeding complete!');
  console.log({
    email: user.email,
    password: passwordPlain,
    clientId: client.clientId,
  });
}

main()
  .catch((err) => {
    console.error('❌ Seed error:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
