import { withAuth } from 'next-auth/middleware'

export default withAuth({
  pages: {
    signIn: '/login',
  },
  callbacks: {
    authorized: ({ token, req }) => {
      const { pathname } = req.nextUrl
      
      console.log('🔒 Middleware check - Path:', pathname, 'Has token:', !!token)
      
      // CRITICAL: Always allow NextAuth API routes (this fixes the loop)
      if (pathname.startsWith('/api/auth')) {
        console.log('✅ Allowing NextAuth API:', pathname)
        return true
      }
      
      // Always allow public routes
      if (pathname.startsWith('/login') || 
          pathname.startsWith('/register') ||
          pathname.startsWith('/api/signup') ||
          pathname.startsWith('/portal') ||
          pathname.startsWith('/api/portal') ||
          pathname.startsWith('/_next') ||
          pathname === '/favicon.ico') {
        console.log('✅ Allowing public route:', pathname)
        return true
      }
      
      // For all other routes, check if user is authenticated
      const isAuthorized = !!token
      console.log(isAuthorized ? '✅ Access granted' : '❌ Access denied - redirecting to login')
      return isAuthorized
    },
  },
})

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - Static files (_next/static, _next/image, favicon.ico)
     * - API routes that should be public
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
