import type { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        try {
          // Try database first
          const user = await prisma.user.findUnique({
            where: { email: credentials.email },
            select: {
              id: true,
              email: true,
              name: true,
              password: true,
              isSupervisor: true,
            }
          })

          if (user && user.password) {
            const isValid = await bcrypt.compare(credentials.password, user.password)
            if (isValid) {
              return {
                id: user.id,
                email: user.email,
                name: user.name,
                isSupervisor: user.isSupervisor,
              }
            }
          }
        } catch (error) {
          console.log('Database auth failed, trying hardcoded users:', error instanceof Error ? error.message : 'Unknown error')
        }

        // Fallback to hardcoded users for MVP
        const validUsers = [
          {
            id: 'user_regulador',
            email: 'regulador@csi.local',
            name: 'Regulador CSI',
            password: 'csi123',
            isSupervisor: false
          },
          {
            id: 'user_supervisor', 
            email: 'supervisor@csi.local',
            name: 'Supervisor CSI',
            password: 'csi123',
            isSupervisor: true
          }
        ]

        // Check hardcoded credentials
        const hardcodedUser = validUsers.find(user => 
          user.email === credentials.email && user.password === credentials.password
        )

        if (hardcodedUser) {
          return {
            id: hardcodedUser.id,
            email: hardcodedUser.email,
            name: hardcodedUser.name,
            isSupervisor: hardcodedUser.isSupervisor,
          }
        }

        return null
      }
    })
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/login',
    signOut: '/login',
    error: '/login',
  },
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === 'production' 
        ? '__Secure-next-auth.session-token' 
        : 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        // Remover domain específico para evitar problemas
        domain: process.env.NODE_ENV === 'production' 
          ? undefined  // Deixar o browser gerenciar automaticamente
          : undefined,
      },
    },
  },
  callbacks: {
    // NOVO: Callback de redirect para gerenciar redirecionamentos
    async redirect({ url, baseUrl }) {
      console.log('Redirect callback - URL:', url, 'BaseURL:', baseUrl)
      
      // Se é uma URL relativa, usar baseUrl
      if (url.startsWith("/")) {
        const redirectUrl = `${baseUrl}${url}`
        console.log('Redirecting to relative URL:', redirectUrl)
        return redirectUrl
      }
      
      // Se a URL é da mesma origem, permitir
      if (new URL(url).origin === baseUrl) {
        console.log('Redirecting to same origin:', url)
        return url
      }
      
      // Default: redirecionar para profile
      const defaultUrl = `${baseUrl}/profile`
      console.log('Redirecting to default profile:', defaultUrl)
      return defaultUrl
    },
    
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.email = user.email
        token.name = user.name
        token.isSupervisor = (user as any).isSupervisor
        console.log('JWT callback - User logged in:', user.email)
      }
      return token
    },
    
    async session({ session, token }) {
      if (token && session?.user) {
        session.user.id = token.id as string
        session.user.email = token.email as string
        session.user.name = token.name as string
        session.user.isSupervisor = token.isSupervisor as boolean
        console.log('Session callback - Session created for:', session.user.email)
      }
      return session
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  // Configurações adicionais para debug
  debug: process.env.NODE_ENV === 'development',
  logger: {
    error(code, metadata) {
      console.error('NextAuth Error:', code, metadata)
    },
    warn(code) {
      console.warn('NextAuth Warning:', code)
    },
    debug(code, metadata) {
      console.log('NextAuth Debug:', code, metadata)
    }
  }
}
