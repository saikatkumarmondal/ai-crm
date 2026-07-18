// prisma/seed.ts

import { authService } from "../src/lib/services/auth.service";

async function main() {
  await authService.ensureDefaultAdmin();
}

main()
  .then(() => {
    console.log("Seed completed.");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  });