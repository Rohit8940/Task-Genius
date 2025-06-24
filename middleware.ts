// middleware.ts (root level)
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isPublicRoute = createRouteMatcher([
  '/sign-in(.*)',
  '/sign-up(.*)',
])

export default clerkMiddleware((auth, req) => {
  if (!isPublicRoute(req)) {
    return auth().then(({ userId }) => {
      if (!userId) {
        return Response.redirect(new URL('/sign-in', req.url))
      }
    })
  }
})

export const config = {
  matcher: [
    '/((?!_next|.*\\..*).*)', // everything except static files
    '/(api|trpc)(.*)',        // include API routes
  ]
}
