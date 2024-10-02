import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { auth } from "../../../lib/firebase"
import { signInWithEmailAndPassword } from "firebase/auth"

export default NextAuth({
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Missing credentials");
        }

        try {
          const userCredential = await signInWithEmailAndPassword(auth, credentials.email, credentials.password);
          if (userCredential.user) {
            return { id: userCredential.user.uid, email: userCredential.user.email };
          }
          return null;
        } catch (error) {
          console.error("Authentication error:", error);
          return null;
        }
      }
    })
  ],
  pages: {
    signIn: '/login',
    error: '/login', // Redirect to login page on error
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
      }
      return session;
    }
  }
})