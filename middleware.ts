import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isPublicRoute = createRouteMatcher([
  '/',
  '/events/:id',
  '/api/uploadthing',
]);

export default clerkMiddleware((auth, req) => {
  const { pathname } = req.nextUrl;

  // Bypass Clerk middleware for webhook routes
  if (
    pathname === '/api/webhook/clerk' ||
    pathname === '/api/webhook/stripe'
  ) {
    return;
  }

  // Public routes: don't require authentication
  if (isPublicRoute(req)) {
    return;
  }

  // Require authentication for all other routes
  
 
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
