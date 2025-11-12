import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const email = 'nojus.siugzdinis@gmail.com';
  const testCode = '123456';

  console.log(`Setting verification code for ${email}...`);

  // Delete any existing verification codes for this email
  await prisma.customerVerification.deleteMany({
    where: { email },
  });

  // Create new verification code that expires in 1 hour
  const verification = await prisma.customerVerification.create({
    data: {
      email,
      code: testCode,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
    },
  });

  console.log('✅ Verification code set successfully!');
  console.log(`Email: ${verification.email}`);
  console.log(`Code: ${verification.code}`);
  console.log(`Expires at: ${verification.expiresAt}`);
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
