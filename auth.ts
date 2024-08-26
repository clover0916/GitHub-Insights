import NextAuth from 'next-auth'
import type { NextAuthConfig } from 'next-auth'
import 'next-auth/jwt'
import GitHub from 'next-auth/providers/github'

const config = {
  secret: process.env.AUTH_SECRET,
  pages: {
    signIn: '/login'
  },
  callbacks: {
    async authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const isOnLoginPage = nextUrl.pathname.startsWith('/login')

      if (isLoggedIn) {
        if (isOnLoginPage) {
          return Response.redirect(new URL('/', nextUrl))
        }
      }

      return true
    },
    async jwt({ token, trigger, account, session }) {
      if (trigger === 'update') token.name = session.user.name
      if (account) {
        token.accessToken = account.access_token
        token.id = account.providerAccountId
      }
      return token
    },
    async session({ session, token, user }: any) {
      // Send properties to the client, like an access_token and user id from a provider.
      session.accessToken = token.accessToken
      session.user.id = token.id

      return session
    }
  },
  providers: [
    GitHub({
      clientId: process.env.GITHUB_ID,
      clientSecret: process.env.GITHUB_SECRET,
      authorization: {
        params: {
          scope: 'repo read:user user:email'
        }
      }
    })
  ]
} satisfies NextAuthConfig

export const { handlers, auth, signIn, signOut } = NextAuth(config)

declare module 'next-auth' {
  interface Session {
    accessToken?: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    accessToken?: string
  }
}
