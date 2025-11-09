import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL || 'nojus.siugzdinis@gmail.com';
  const password = process.env.ADMIN_PASSWORD || 'changeme123';
  const name = process.env.ADMIN_NAME || 'Nojus Siugzdinis';

  console.log('Creating initial admin user...');
  console.log('Email:', email);
  console.log('Name:', name);

  // Check if admin already exists
  const existing = await prisma.admin.findUnique({
    where: { email: email.toLowerCase() },
  });

  if (existing) {
    console.log('Admin user already exists. Skipping...');
    return;
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Create admin
  const admin = await prisma.admin.create({
    data: {
      email: email.toLowerCase(),
      name,
      hashedPassword,
      role: 'super_admin',
      mustChangePassword: false,
    },
  });

  console.log('Admin user created successfully!');
  console.log('ID:', admin.id);
  console.log('Email:', admin.email);
  console.log('Role:', admin.role);
  console.log('\nYou can now log in at /admin/login');
}

main()
  .catch((e) => {
    console.error('Error creating admin:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
