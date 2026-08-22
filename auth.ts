import NextAuth, { User } from "next-auth";

import { DrizzleAdapter } from "@auth/drizzle-adapter";

import { db } from ".";

import Credentials from "next-auth/providers/credentials";

import { users } from "./db/schema";

import { eq } from "drizzle-orm";

import { compare } from "bcryptjs";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db),

  session: {
    strategy: "jwt",
  },

  providers: [
    Credentials({
      credentials: {
        email: {},

        password: {},
      },

      authorize: async (credentials) => {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await db
          .select()

          .from(users)

          .where(eq(users.email, credentials.email.toString()))
          .limit(1);

        if (user.length === 0) {
          return null;
        }

        const isPasswordValid = await compare(
          credentials.password.toString(),
          user[0].password,
        );

        if (!isPasswordValid) {
          return null;
        }

        return {
          id: user[0].id.toString(),

          email: user[0].email,

          name: user[0].fullName,
        } as User;
      },
    }),
  ],

  pages: {
    signIn: "signin",
  },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;

        token.name = user.name;
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;

        session.user.name = token.name as string;
      }

      return session;
    },
  },
});
