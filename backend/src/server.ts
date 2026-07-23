import "dotenv/config";

import app from "./app";

const PORT = process.env.PORT ?? "5000";

app.listen(PORT, () => {
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  Enterprise Travel Management System — Backend API");
  console.log(`  Environment : ${process.env.NODE_ENV ?? "development"}`);
  console.log(`  Server      : http://localhost:${PORT}`);
  console.log(`  Health      : http://localhost:${PORT}/`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
});
