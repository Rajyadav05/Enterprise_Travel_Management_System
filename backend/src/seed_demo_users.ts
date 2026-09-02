import bcrypt from "bcrypt";
import { prisma } from "./config/prisma";

async function seedDemoUsers() {
  console.log("Checking Demo Users...");

  const [adminRole, empRole, itDept, hrDept, seDesig, mumbaiBranch] =
    await Promise.all([
      prisma.role.findUniqueOrThrow({ where: { name: "ADMIN" } }),
      prisma.role.findUniqueOrThrow({ where: { name: "EMPLOYEE" } }),
      prisma.department.findUniqueOrThrow({ where: { name: "IT" } }),
      prisma.department.findUniqueOrThrow({ where: { name: "HR" } }),
      prisma.designation.findUniqueOrThrow({
        where: { name: "Software Engineer" },
      }),
      prisma.branch.findFirstOrThrow({ where: { name: "Mumbai HQ" } }),
    ]);

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash("Password123!", salt);

  // Check employees and users in database
  const users = await prisma.user.findMany({
    include: {
      role: true,
      employee: true,
    },
    take: 5,
  });

  console.log("Sample Users in DB:");
  users.forEach((u) => {
    console.log(
      `- Email: ${u.email} | Role: ${u.role.name} | EmpId: ${u.employee?.employeeId}`
    );
  });

  // Ensure Sarah Jenkins / Employee User exists
  const existingEmp = await prisma.employee.findUnique({
    where: { employeeId: "EMP001" },
    include: { user: true },
  });

  if (existingEmp && existingEmp.user) {
    // Update password so it's Password123!
    await prisma.user.update({
      where: { id: existingEmp.user.id },
      data: { passwordHash, isActive: true },
    });
    console.log(`[OK] Updated EMP001 (${existingEmp.user.email}) password to Password123!`);
  }
}

seedDemoUsers()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
