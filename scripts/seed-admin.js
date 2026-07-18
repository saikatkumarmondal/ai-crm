const { PrismaClient, UserRole, AuthProvider } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL || 'admin@ai-crm.dev';
  const password = process.env.ADMIN_PASSWORD || 'Admin123!';
  const fullName = process.env.ADMIN_NAME || 'System Admin';
  const organizationName = process.env.ADMIN_ORGANIZATION_NAME || 'AI CRM Admin';
  const organizationSlug = process.env.ADMIN_ORGANIZATION_SLUG || 'ai-crm-admin';

  const existingUser = await prisma.user.findUnique({ where: { email } });

  if (existingUser) {
    console.log(`Admin already exists with email: ${email}`);
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.$transaction(async (tx) => {
    let organization = await tx.organization.findUnique({
      where: { slug: organizationSlug },
    });

    if (!organization) {
      organization = await tx.organization.create({
        data: {
          name: organizationName,
          slug: organizationSlug,
        },
      });
    }

    await tx.user.create({
      data: {
        fullName,
        email,
        passwordHash,
        organizationId: organization.id,
        role: UserRole.ORG_ADMIN,
        provider: AuthProvider.LOCAL,
        isActive: true,
      },
    });
  });

  console.log('Admin account created successfully.');
  console.log(`Email: ${email}`);
  console.log(`Password: ${password}`);
  console.log(`Organization: ${organizationName}`);
}

main()
  .catch((error) => {
    console.error('Failed to create admin account:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
