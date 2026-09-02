import bcrypt from "bcrypt";
import { prisma } from "./config/prisma";

async function createDemoEmployee() {
  const [empRole, itDept, seDesig, mumbaiBranch] = await Promise.all([
    prisma.role.findUniqueOrThrow({ where: { name: "EMPLOYEE" } }),
    prisma.department.findUniqueOrThrow({ where: { name: "IT" } }),
    prisma.designation.findUniqueOrThrow({
      where: { name: "Software Engineer" },
    }),
    prisma.branch.findFirstOrThrow({ where: { name: "Mumbai HQ" } }),
  ]);

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash("Password123!", salt);

  const existing = await prisma.user.findUnique({
    where: { email: "john.doe@company.com" },
  });

  if (!existing) {
    const user = await prisma.user.create({
      data: {
        email: "john.doe@company.com",
        passwordHash,
        roleId: empRole.id,
        isActive: true,
      },
    });

    await prisma.employee.create({
      data: {
        userId: user.id,
        employeeId: "EMP999",
        firstName: "John",
        lastName: "Doe",
        departmentId: itDept.id,
        designationId: seDesig.id,
        branchId: mumbaiBranch.id,
        status: "ACTIVE",
      },
    });
    console.log("[OK] Created employee: john.doe@company.com / Password123! (ID: EMP999)");
  } else {
    console.log("[INFO] john.doe@company.com already exists");
  }
}

createDemoEmployee()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
