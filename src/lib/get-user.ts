import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";

type AuthUser = {
  id: string;
  email: string;
  name?: string | null;
};

/**
 * Resolves the authenticated user from either a NextAuth session or a Bearer API key.
 * Returns { id, email, name } or null if unauthenticated.
 */
export async function getUser(): Promise<AuthUser | null> {
  // 1. Try NextAuth session
  const session = await auth();
  if (session?.user?.id) {
    return {
      id: session.user.id,
      email: session.user.email ?? "",
      name: session.user.name,
    };
  }

  // 2. Try Bearer API key
  const botApiKey = process.env.BOT_API_KEY;
  if (!botApiKey) return null;

  const headersList = await headers();
  const authHeader = headersList.get("authorization");
  if (authHeader !== `Bearer ${botApiKey}`) return null;

  // Resolve bot user by email env var or fall back to first user in DB
  const botEmail = process.env.BOT_USER_EMAIL;
  const user = botEmail
    ? await prisma.user.findUnique({ where: { email: botEmail } })
    : await prisma.user.findFirst();

  if (!user) return null;

  return { id: user.id, email: user.email, name: user.name };
}
