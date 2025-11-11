// Migration script to move existing Service.doctorId to DoctorService junction table
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Starting migration...');

  // Get all services with their doctorId
  const services = await prisma.$queryRaw`
    SELECT id, "doctorId" FROM "Service" WHERE "doctorId" IS NOT NULL
  `;

  console.log(`Found ${services.length} services to migrate`);

  // Create junction table records
  for (const service of services) {
    console.log(`Migrating service ${service.id} for doctor ${service.doctorId}`);

    // Check if DoctorService table exists
    try {
      await prisma.$executeRaw`
        INSERT INTO "DoctorService" ("doctorId", "serviceId", "isActive", "createdAt")
        VALUES (${service.doctorId}, ${service.id}, true, NOW())
        ON CONFLICT DO NOTHING
      `;
    } catch (error) {
      if (error.code === '42P01') {
        console.log('DoctorService table does not exist yet, skipping migration');
        break;
      }
      throw error;
    }
  }

  console.log('Migration completed!');
}

main()
  .catch((e) => {
    console.error('Migration failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
