/**
 * Database seed script.
 * Seed data will be added when models are defined.
 */
async function main(): Promise<void> {
  console.log("No seed data configured yet.");
}

main()
  .catch((error: unknown) => {
    console.error("Seed failed:", error);
    process.exit(1);
  });
