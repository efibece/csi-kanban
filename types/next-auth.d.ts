
import NextAuth from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      isSupervisor?: boolean
    }
  }

  interface User {
    id: string
    name?: string | null
    email?: string | null
    image?: string | null
    isSupervisor?: boolean
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    isSupervisor?: boolean
  }
}
