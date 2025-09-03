
import { withAuth } from 'next-auth/middleware'

export default withAuth({
  pages: {
    signIn: '/login',
  },
  callbacks: {
    authorized: ({ token, req }) => {
      const { pathname } = req.nextUrl
      
      // Always allow access to auth, portal, static files, login and register
      if (pathname.startsWith('/api/auth') || 
          pathname.startsWith('/login') || 
          pathname.startsWith('/register') ||
          pathname.startsWith('/api/signup') ||
          pathname.startsWith('/portal') ||
          pathname.startsWith('/api/portal') ||
          pathname.startsWith('/_next') ||
          pathname === '/favicon.ico') {
        return true
      }
      
      // For all other routes, check if user is authenticated
      return !!token
    },
  },
})

export const config = {
  matcher: [
    /*
     * Match all paths except static files and auth routes
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
