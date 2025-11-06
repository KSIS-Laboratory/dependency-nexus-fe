# Dependency Nexus - Frontend

Next.js 16 frontend for Dependency Nexus with GitHub App authentication.

## Features

- **GitHub App authentication** - OAuth 2.0 with fine-grained permissions
- **Automatic token refresh** - Seamless token renewal without re-login
- **Modern UI** - Tailwind CSS with dark mode support
- **Protected routes** - Authentication-based access control
- **JWT token management** - Secure client-side token handling
- **Responsive design** - Mobile-friendly interface

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **UI Components**: DaisyUI, Lucide React
- **State Management**: React Hooks

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   # or
   bun install
   ```

2. **Configure environment variables:**
   ```bash
   cp env.example .env.local
   ```
   
   Edit `.env.local` with your backend API URL (see `../OAUTH_SETUP.md` for details).

3. **Run the development server:**
   ```bash
   npm run dev
   # or
   bun dev
   ```

4. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Project Structure

```
app/
├── auth/
│   └── callback/      # OAuth callback handler
│       └── page.tsx
├── dashboard/         # Protected dashboard
│   └── page.tsx
├── layout.tsx         # Root layout
├── page.tsx           # Login page
└── globals.css        # Global styles

lib/
├── auth.ts            # Authentication service
└── utils.ts           # Utility functions
```

## Routes

- `/` - Login page with GitHub OAuth button
- `/auth/callback` - OAuth callback handler (automatic redirect)
- `/dashboard` - Protected dashboard (requires authentication)

## Authentication Flow

1. User clicks "Continue with GitHub" on login page
2. Redirected to backend GitHub App endpoint
3. Backend redirects to GitHub for authorization (with fine-grained permissions)
4. User authorizes the application
5. GitHub redirects back to backend callback
6. Backend exchanges code for **user access token + refresh token**
7. Backend creates JWT containing both tokens
8. Redirected to frontend callback with JWT token
9. Tokens stored in localStorage (access + refresh + expiry)
10. User redirected to dashboard

### Automatic Token Refresh

- GitHub App tokens expire after **8 hours**
- Frontend automatically detects expiration
- Uses refresh token to get new access token
- User stays logged in without interruption
- Refresh tokens valid for **6 months**

## Development

The application uses Next.js App Router with client-side rendering for authentication flows. All authentication state is managed through the `AuthService` utility.

### Key Files

- **`lib/auth.ts`** - Authentication service with token management
- **`app/page.tsx`** - Login page with GitHub OAuth
- **`app/auth/callback/page.tsx`** - Handles OAuth callback
- **`app/dashboard/page.tsx`** - Protected dashboard page

## Environment Variables

See `env.example` for required environment variables:
- `NEXT_PUBLIC_API_URL` - Backend API URL (default: http://localhost:8000)

## Documentation

For complete OAuth setup instructions, see [OAUTH_SETUP.md](../OAUTH_SETUP.md).

## Learn More

To learn more about Next.js, check out:
- [Next.js Documentation](https://nextjs.org/docs)
- [Learn Next.js](https://nextjs.org/learn)
