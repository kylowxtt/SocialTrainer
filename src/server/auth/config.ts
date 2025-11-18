import { PrismaAdapter } from "@auth/prisma-adapter";
import { type DefaultSession, type NextAuthConfig } from "next-auth";
import DiscordProvider from "next-auth/providers/discord";
import GoogleProvider from "next-auth/providers/google";
import InstagramProvider from "next-auth/providers/instagram";

import { db } from "~/server/db";
import { env } from "~/env";

/**
 * Module augmentation for `next-auth` types. Allows us to add custom properties to the `session`
 * object and keep type safety.
 *
 * @see https://next-auth.js.org/getting-started/typescript#module-augmentation
 */
declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      role?: "CLIENT" | "COACH" | "ADMIN";
      isCoach?: boolean;
      isClient?: boolean;
    } & DefaultSession["user"];
  }
}

/**
 * Options for NextAuth.js used to configure adapters, providers, callbacks, etc.
 *
 * @see https://next-auth.js.org/configuration/options
 */
export const authConfig = {
  providers: [
    DiscordProvider({
      clientId: env.AUTH_DISCORD_ID,
      clientSecret: env.AUTH_DISCORD_SECRET,
    }),
    GoogleProvider({
      clientId: env.AUTH_GOOGLE_ID,
      clientSecret: env.AUTH_GOOGLE_SECRET,
    }),
    InstagramProvider({
      clientId: env.AUTH_INSTAGRAM_ID,
      clientSecret: env.AUTH_INSTAGRAM_SECRET,
    }),
  ],
  adapter: PrismaAdapter(db),
  pages: {
    signIn: "/auth/signin",
  },
  callbacks: {
    session: async ({ session, user }) => {
      // Fetch user with profile relations to determine role and profile status
      const userWithProfiles = await db.user.findUnique({
        where: { id: user.id },
        select: {
          role: true,
          coachProfile: { select: { id: true } },
          clientProfile: { select: { id: true } },
        },
      });

      return {
        ...session,
        user: {
          ...session.user,
          id: user.id,
          role: userWithProfiles?.role ?? "CLIENT",
          isCoach: !!userWithProfiles?.coachProfile,
          isClient: !!userWithProfiles?.clientProfile,
        },
      };
    },
  },
} satisfies NextAuthConfig;
