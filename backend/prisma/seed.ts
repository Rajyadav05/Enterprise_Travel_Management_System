import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main(): Promise<void> {
  console.log("Starting ETMS database seed...");

  // ============================================================
  // ROLES
  // ============================================================

  const adminRole = await prisma.role.upsert({
    where: {
      name: "ADMIN",
    },
    update: {
      description: "System administrator with access to manage travel requests and bookings.",
    },
    create: {
      name: "ADMIN",
      description: "System administrator with access to manage travel requests and bookings.",
    },
  });

  const employeeRole = await prisma.role.upsert({
    where: {
      name: "EMPLOYEE",
    },
    update: {
      description: "Company employee who can submit travel requests.",
    },
    create: {
      name: "EMPLOYEE",
      description: "Company employee who can submit travel requests.",
    },
  });

  console.log(`[OK] Roles seeded: ${adminRole.name}, ${employeeRole.name}`);

  // ============================================================
  // DEPARTMENTS
  // ============================================================

  const departments = [
    {
      name: "IT",
      description: "Information Technology department.",
    },
    {
      name: "HR",
      description: "Human Resources department.",
    },
    {
      name: "Finance",
      description: "Finance and accounting department.",
    },
    {
      name: "Sales",
      description: "Sales and business development department.",
    },
    {
      name: "Administration",
      description: "Administration and corporate operations department.",
    },
  ];

  for (const department of departments) {
    await prisma.department.upsert({
      where: {
        name: department.name,
      },
      update: {
        description: department.description,
      },
      create: department,
    });
  }

  console.log(`[OK] Departments seeded: ${departments.length}`);

  // ============================================================
  // DESIGNATIONS
  // ============================================================

  const designations = [
    {
      name: "Software Engineer",
      description: "Software engineering professional.",
    },
    {
      name: "Senior Software Engineer",
      description: "Senior software engineering professional.",
    },
    {
      name: "Team Lead",
      description: "Technical or functional team lead.",
    },
    {
      name: "Manager",
      description: "Department or team manager.",
    },
    {
      name: "HR Executive",
      description: "Human resources executive.",
    },
  ];

  for (const designation of designations) {
    await prisma.designation.upsert({
      where: {
        name: designation.name,
      },
      update: {
        description: designation.description,
      },
      create: designation,
    });
  }

  console.log(`[OK] Designations seeded: ${designations.length}`);

  // ============================================================
  // BRANCHES
  // ============================================================

  const branches = [
    {
      name: "Mumbai HQ",
      city: "Mumbai",
      state: "Maharashtra",
      country: "India",
    },
    {
      name: "Pune Office",
      city: "Pune",
      state: "Maharashtra",
      country: "India",
    },
    {
      name: "Delhi Office",
      city: "New Delhi",
      state: "Delhi",
      country: "India",
    },
  ];

  for (const branch of branches) {
    const existingBranch = await prisma.branch.findFirst({
      where: {
        name: branch.name,
      },
    });

    if (existingBranch) {
      await prisma.branch.update({
        where: {
          id: existingBranch.id,
        },
        data: {
          city: branch.city,
          state: branch.state,
          country: branch.country,
        },
      });
    } else {
      await prisma.branch.create({
        data: branch,
      });
    }
  }

  console.log(`[OK] Branches seeded: ${branches.length}`);

  console.log("==========================================");
  console.log("ETMS database seed completed successfully.");
  console.log("==========================================");
}

main()
  .catch((error: unknown) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
