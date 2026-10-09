import { config } from "dotenv";
import path from "node:path";

config({ path: path.resolve(process.cwd(), "../../.env.local") });
config({ path: path.resolve(process.cwd(), "../../.env") });

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL is missing. Add it to .env.local before running npm run seed:auth.",
  );
}

const email = process.env.SEED_ADMIN_EMAIL ?? "admin@example.com";
const password = process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe123!";
const name = process.env.SEED_ADMIN_NAME ?? "HR Administrator";

async function main() {
  const { eq } = await import("drizzle-orm");
  const { db } = await import("../src/db");
  const { user } = await import("../src/db/auth-schema");
  const { auth } = await import("../src/lib/auth");
  const [existingUser] = await db
    .select({ id: user.id })
    .from(user)
    .where(eq(user.email, email))
    .limit(1);

  if (!existingUser) {
    try {
      await auth.api.signUpEmail({ body: { email, password, name } });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown seed error";
      throw new Error(`Unable to seed the admin user: ${message}`);
    }
  }

  const [updatedUser] = await db
    .update(user)
    .set({ role: "super_admin", emailVerified: true, updatedAt: new Date() })
    .where(eq(user.email, email))
    .returning({ id: user.id });

  if (!updatedUser) throw new Error("Unable to promote the admin account.");

  console.log(`Seeded auth user: ${email}`);
}

void main();
