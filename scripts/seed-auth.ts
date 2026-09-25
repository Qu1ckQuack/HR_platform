import { config } from "dotenv";

config({ path: ".env.local" });
config({ path: ".env" });

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL is missing. Add it to .env.local before running npm run seed:auth.",
  );
}

const email = process.env.SEED_ADMIN_EMAIL ?? "admin@example.com";
const password = process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe123!";
const name = process.env.SEED_ADMIN_NAME ?? "HR Administrator";

async function main() {
  const { auth } = await import("../src/lib/auth");

  try {
    await auth.api.signUpEmail({
      body: { email, password, name },
    });
  } catch (error) {
    const cause =
      typeof error === "object" && error !== null && "cause" in error
        ? error.cause
        : undefined;
    const causeMessage =
      cause instanceof Error
        ? cause.message
        : typeof cause === "object" && cause !== null && "message" in cause
          ? String(cause.message)
          : undefined;
    const message = error instanceof Error ? error.message : "Unknown seed error";
    const detail = causeMessage ? `${message}; cause: ${causeMessage}` : message;
    throw new Error(`Unable to seed the admin user: ${detail}`);
  }

  console.log(`Seeded auth user: ${email}`);
}

void main();
