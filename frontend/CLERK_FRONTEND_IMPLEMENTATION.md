# Clerk Frontend Implementation

## Overview
Complete Clerk authentication integration with user synchronization, role-based access control, and protected routes.

## Implementation Summary

### 1. Clerk Configuration

#### Packages Installed
- `@clerk/clerk-react` - Clerk React SDK

#### Environment Variables
```bash
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_cHJldHR5LWd1bGwtNjMuY2xlcmsuYWNjb3VudHMuZGV2JA
```

#### Root Layout Setup
- Wrapped app with `ClerkProvider` in `src/app/layout.tsx`
- Added `UserProvider` inside `QueryProvider`
- Provider hierarchy: ClerkProvider → QueryProvider → UserProvider

### 2. Authentication API Client

#### Auth-Aware API Client (`src/lib/api/auth-client.ts`)
- Factory function that creates axios instance with token injection
- Automatically attaches Clerk session token to all requests
- Handles 401 errors by redirecting to sign-in

#### useAuthApi Hook (`src/hooks/use-auth-api.ts`)
- React hook that provides authenticated API client
- Uses Clerk's `getToken()` to fetch current session token
- Memoized to avoid recreating client on every render

#### Usage Example
```tsx
import { useAuthApi } from '@/hooks/use-auth-api';

function MyComponent() {
  const apiClient = useAuthApi();

  // All requests automatically include auth token
  const data = await apiClient.get('/users/me');
}
```

### 3. User Context & Synchronization

#### User Types (`src/types/user.ts`)
- `UserRole` enum matching backend roles
- `User` interface matching backend User entity

#### Users Service (`src/lib/api/services/users.service.ts`)
- `getCurrentUser()` - Fetch current user profile
- `syncUser()` - Sync user from Clerk to backend
- `getUsers()` - List users (Admin/Content Manager)
- `getUsersByRole()` - Filter users by role
- `updateUser()` - Update user profile
- `updateUserRole()` - Change user role (Admin)

#### User Context (`src/contexts/user-context.tsx`)
- Provides global user state across app
- Automatically syncs user on first login
- Exposes helper methods:
  - `user` - Current user object
  - `loading` - Loading state
  - `error` - Error state
  - `refetch()` - Manually refresh user
  - `hasRole(roles)` - Check if user has role
  - `isAdmin` - Admin check
  - `isContentManager` - Content Manager check
  - `isCopywriter` - Copywriter check
  - `isReviewer` - Reviewer check

#### Usage Example
```tsx
import { useUserContext } from '@/contexts/user-context';

function MyComponent() {
  const { user, loading, hasRole, isAdmin } = useUserContext();

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <p>Welcome {user?.firstName}!</p>
      {isAdmin && <AdminPanel />}
      {hasRole(['admin', 'content_manager']) && <ManagementPanel />}
    </div>
  );
}
```

### 4. Authentication Pages

#### Sign In (`src/app/sign-in/[[...sign-in]]/page.tsx`)
- Full-screen centered sign-in form
- Uses Clerk's `<SignIn>` component
- Styled with custom appearance
- Redirects to `/` after sign-in

#### Sign Up (`src/app/sign-up/[[...sign-up]]/page.tsx`)
- Full-screen centered sign-up form
- Uses Clerk's `<SignUp>` component
- Styled with custom appearance
- Redirects to `/` after sign-up

### 5. Protected Routes

#### ProtectedRoute Component (`src/components/auth/protected-route.tsx`)
- Wraps pages that require authentication
- Shows loading spinner while checking auth
- Redirects to `/sign-in` if not authenticated
- Optional role-based access control

#### Usage Example
```tsx
import { ProtectedRoute } from '@/components/auth/protected-route';

export default function MyPage() {
  return (
    <ProtectedRoute>
      <div>Protected content</div>
    </ProtectedRoute>
  );
}
```

#### Pages Protected
- `/` - Home page (campaign dashboard)
- `/campaign/[id]` - Campaign detail page

### 6. Role-Based UI Components

#### RoleGate Component (`src/components/auth/role-gate.tsx`)
- Conditionally renders children based on user role
- Supports single role or array of roles
- Optional fallback content if role doesn't match

#### Usage Example
```tsx
import { RoleGate } from '@/components/auth/role-gate';

function MyComponent() {
  return (
    <div>
      <RoleGate allowedRoles={['admin', 'content_manager']}>
        <AdminFeature />
      </RoleGate>

      <RoleGate allowedRoles="admin" fallback={<p>Admin only</p>}>
        <DeleteButton />
      </RoleGate>
    </div>
  );
}
```

### 7. UI Components

#### AppHeader (`src/components/layout/app-header.tsx`)
- Global header with branding
- User profile display with role badge
- Clerk's `<UserButton>` for account management
- Backend connection status indicator
- Role-based badge colors:
  - Admin: Purple
  - Content Manager: Blue
  - Copywriter: Green
  - Reviewer: Orange
  - Viewer: Gray

#### UserProfileCard (`src/components/layout/user-profile-card.tsx`)
- Detailed user profile card
- Shows: Name, email, role, organization, join date, last login
- Role badge with color coding
- User status (active/inactive)
- Loading and error states

## Authentication Flow

### First-Time User Login

1. User clicks "Sign In" → Redirected to `/sign-in`
2. User authenticates with Clerk (email/password, OAuth, etc.)
3. Clerk redirects to `/` with session token
4. `UserProvider` detects new session
5. Calls `UsersService.getCurrentUser()`
6. If 404 (user not in backend), calls `UsersService.syncUser()`
7. Backend creates user record from Clerk data
8. User object stored in context and available globally

### Subsequent Logins

1. User signs in with Clerk
2. `UserProvider` calls `getCurrentUser()`
3. User loaded from backend database
4. Last login timestamp updated

### API Requests

1. Component uses `useAuthApi()` hook
2. Request interceptor calls Clerk's `getToken()`
3. Token attached to `Authorization: Bearer <token>` header
4. Backend middleware verifies token with Clerk
5. Backend loads user from database
6. Request proceeds with full user context

## Role-Based Features

### Admin
- Full access to all features
- User management
- Role assignment
- System configuration

### Content Manager
- Create and manage campaigns
- Assign tasks to users
- View organization activity
- Manage content workflow

### Copywriter
- Create content
- Work on assigned tasks
- View own assignments
- Default role for new users

### Reviewer
- Review and approve/reject content
- View assigned review tasks
- Provide feedback

### Viewer
- Read-only access
- View campaigns and content
- Cannot create or modify

## Testing the Implementation

### 1. Start the Application

```bash
# Terminal 1 - Backend
cd backend
npm run start:dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### 2. Create a Test User

1. Navigate to http://localhost:3000
2. Click "Sign In" (or get redirected)
3. Click "Sign Up" to create account
4. Fill in email and password
5. Complete sign-up flow

### 3. Verify User Sync

1. After sign-up, check backend logs for "User not found, syncing from Clerk..."
2. User should be created in database with default role (copywriter)
3. Refresh page - user should load without sync

### 4. Test Role-Based Features

1. Open database and change user role to 'admin'
2. Refresh frontend
3. Verify role badge changes to "Admin" with purple color
4. Test role gates by viewing admin-only features

### 5. Test Protected Routes

1. Sign out using UserButton
2. Try to access `/`
3. Should redirect to `/sign-in`
4. Sign back in
5. Should return to `/`

## Updating Existing API Calls

To update existing API service calls to use authentication:

### Before (Old Way)
```tsx
import { apiClient } from '@/lib/api/client';

const data = await apiClient.get('/campaigns');
```

### After (New Way)
```tsx
import { useAuthApi } from '@/hooks/use-auth-api';

function MyComponent() {
  const apiClient = useAuthApi();

  const data = await apiClient.get('/campaigns');
}
```

### In Services
Update service constructors to accept `AxiosInstance`:

```tsx
// Before
export class CampaignService {
  static async getCampaigns() {
    return apiClient.get('/campaigns');
  }
}

// After
export class CampaignService {
  constructor(private apiClient: AxiosInstance) {}

  async getCampaigns() {
    return this.apiClient.get('/campaigns');
  }
}

// Usage
function MyComponent() {
  const apiClient = useAuthApi();
  const campaignService = new CampaignService(apiClient);

  const campaigns = await campaignService.getCampaigns();
}
```

## Next Steps

### Update Existing Services
- [ ] Update CampaignService to use authenticated client
- [ ] Update ContentService to use authenticated client
- [ ] Update all API hooks to use `useAuthApi()`

### Add Role-Based Features
- [ ] Admin user management page
- [ ] Content Manager assignment creation
- [ ] Copywriter task dashboard
- [ ] Reviewer approval workflow

### Enhance UI
- [ ] Add user settings page
- [ ] Show role-specific dashboards
- [ ] Add activity feed
- [ ] Add assignment notifications

### Testing
- [ ] Add E2E tests for auth flow
- [ ] Test role-based access control
- [ ] Test token refresh
- [ ] Test error handling

## Troubleshooting

### "User not found in database"
- This is expected on first login
- User will be automatically synced from Clerk
- Check backend logs for sync confirmation

### Infinite redirect loop
- Check Clerk publishable key is correct
- Verify ClerkProvider is wrapping entire app
- Check `/sign-in` and `/sign-up` paths are configured

### API requests fail with 401
- Check token is being attached (Network tab → Headers)
- Verify Clerk secret key in backend `.env`
- Check token hasn't expired (Clerk default: 1 hour)

### User context shows loading forever
- Check API URL is correct in `.env.local`
- Verify backend is running
- Check browser console for errors
- Verify `/users/me` or `/users/sync` endpoint works

### Role badge not showing
- Verify user has role in database
- Check UserContext is loading user
- Inspect user object in React DevTools

## Security Notes

1. **Token Storage**: Tokens managed by Clerk, stored in secure httpOnly cookies
2. **Token Verification**: All tokens verified by backend with Clerk
3. **Role Enforcement**: Roles checked on both frontend (UX) and backend (security)
4. **HTTPS Required**: Use HTTPS in production for secure token transmission
5. **Token Expiry**: Tokens auto-refresh by Clerk SDK
